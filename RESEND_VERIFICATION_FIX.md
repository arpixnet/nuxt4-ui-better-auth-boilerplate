# Fix: Resend Verification Email Error

## Problem

The endpoint `/api/auth/resend-verification` was failing with error:
```
ERROR: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

## Root Cause

The code was **manually implementing** email verification logic instead of using Better-Auth's official API:

1. **Manual token generation** with `crypto.randomUUID()`
2. **Manual database insertion** with `ON CONFLICT (identifier)`
3. **Manual rate limiting** in server endpoint

This approach was incorrect because:
- Better-Auth has its own logic for managing verification tokens
- Better-Auth doesn't require a UNIQUE constraint on the `identifier` column
- The documentation explicitly states to use `authClient.sendVerificationEmail()`

## Solution

Follow Better-Auth's official documentation by:

### 1. Using Better-Auth Client API

**Before (incorrect):**
```typescript
const response = await fetch('/api/auth/resend-verification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: emailToSend }),
})
```

**After (correct - per Better-Auth docs):**
```typescript
const result = await authClient.sendVerificationEmail({
  email: emailToSend,
  callbackURL: '/auth/login',
})

if (result.error) {
  throw new Error(result.error.message)
}
```

### 2. Frontend Rate Limiting

Created `app/composables/useEmailRateLimit.ts` to handle rate limiting on the client side:
- Maximum: 3 requests per hour per email address
- State persisted in memory for the session
- Automatic reset when window expires or email changes

**Usage:**
```typescript
const { checkRateLimit, recordRequest } = useEmailRateLimit()

// Check before sending
const rateLimit = checkRateLimit(email)
if (!rateLimit.allowed) {
  error.value = 'Too many requests. Please try again later.'
  return
}

// Record successful request
await authClient.sendVerificationEmail({ email, callbackURL: '/auth/login' })
recordRequest(email)
```

## Changes Made

### New Files
- `app/composables/useEmailRateLimit.ts` - Frontend rate limiting composable

### Updated Files
1. **app/pages/auth/login.vue**
   - Import `useEmailRateLimit` composable
   - Replace manual API call with `authClient.sendVerificationEmail()`
   - Add rate limiting before sending verification email
   - Add `resendLoading` state

2. **app/pages/auth/check-email.vue**
   - Import `useEmailRateLimit` composable
   - Replace manual API call with `authClient.sendVerificationEmail()`
   - Add rate limiting before sending verification email

3. **app/pages/auth/verify-email-pending.vue**
   - Import `useAuthClient` and `useEmailRateLimit`
   - Replace manual API call with `authClient.sendVerificationEmail()`
   - Add rate limiting before sending verification email
   - Fix TypeScript error (changed `color="gray"` to `color="neutral"`)

### Deleted Files
- **server/api/auth/resend-verification.post.ts** - Removed (no longer needed)

## Benefits

1. **Follows Better-Auth Best Practices** - Uses official API as documented
2. **Simpler Code** - Less manual logic, fewer moving parts
3. **No SQL Issues** - Better-Auth handles database operations internally
4. **Better Error Handling** - Better-Auth provides consistent error messages
5. **Frontend Rate Limiting** - Prevents abuse without server-side complexity

## Testing

To test the fix:

1. Register a new account with email verification enabled
2. Wait for email (or skip to test resend)
3. Try to resend verification email
4. Should work without SQL errors
5. Try sending more than 3 times in an hour
6. Should show rate limit error

## References

- [Better-Auth Email Verification Documentation](https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/concepts/email.mdx)
- [Better-Auth API Reference](https://github.com/better-auth/better-auth/blob/canary/docs/content/docs/reference/options.mdx)

## Date

Fixed: December 1, 2026
