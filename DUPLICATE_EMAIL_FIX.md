# Fix: Duplicate Welcome Email on Registration

## Problem

When registering a new user, **2 welcome emails were being sent**:
1. Email #1: "Welcome! Verify Your Email" - ✅ Correct (with verification link)
2. Email #2: "Welcome! You're all set!" - ❌ Incorrect (without verification link, misleading)

The second email incorrectly told the user they already had access without verifying their email.

## Root Cause

**Duplicate email sending logic:**

### 1. Better-Auth Hook (Correct)
```typescript
// server/lib/auth.ts
emailVerification: {
  sendVerificationEmail: async ({ user, url, token }) => {
    // ✅ Correctly sends welcome email with verification link
    await fetch(`${process.env.BETTER_AUTH_URL}/api/email/send-welcome`, {
      method: 'POST',
      body: JSON.stringify({
        userEmail: user.email,
        userName: user.name,
        verificationLink: url, // ✅ Includes verification link
        loginUrl: `${process.env.BETTER_AUTH_URL}/auth/login`,
      }),
    })
  },
  sendOnSignUp: true, // ✅ Automatically sends on registration
}
```

### 2. Manual Call in register.vue (Incorrect)
```typescript
// app/pages/auth/register.vue
const response = await authClient.signUp.email({
  email: formState.value.email,
  password: formState.value.password,
  name: defaultName,
})

// ❌ Manual duplicate call
await fetch('/api/email/send-welcome', {
  method: 'POST',
  body: JSON.stringify({
    userEmail: formState.value.email,
    userName: defaultName,
    loginUrl: `${config.public.betterAuth.url}/auth/login`,
    // ❌ Missing verificationLink
  }),
})
```

## Solution

**Remove the manual call to `/api/email/send-welcome` from `register.vue`**

The Better-Auth hook `sendVerificationEmail` already handles sending the welcome email automatically when `sendOnSignUp: true`. No manual email sending is needed in the registration page.

### Changes Made

**File: `app/pages/auth/register.vue`**

**Before (incorrect):**
```typescript
if (response && !response.error) {
  success.value = true
  
  // ❌ Manual duplicate email sending
  try {
    await fetch('/api/email/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: formState.value.email,
        userName: defaultName,
        loginUrl: `${config.public.betterAuth.url}/auth/login`,
      }),
    })
    console.log('[Register] Welcome email sent to:', formState.value.email)
  } catch (welcomeError) {
    console.error('[Register] Failed to send welcome email:', welcomeError)
  }
  
  // Redirect...
}
```

**After (correct):**
```typescript
if (response && !response.error) {
  success.value = true
  
  // Note: Better-Auth automatically sends welcome email via sendVerificationEmail hook
  // configured in server/lib/auth.ts with sendOnSignUp: true
  // No manual email sending needed here
  
  // Redirect...
}
```

## Result

✅ **Only 1 welcome email is sent**
✅ **Email includes verification link** (when email verification is required)
✅ **Email clearly states verification is needed** (not "you're all set")
✅ **No duplicate emails**
✅ **Better-Auth handles all email logic centrally**

## Email Templates

### Welcome Email (welcome.hbs)
The template correctly handles both scenarios:

**When verification required:**
- Shows "Verify Your Email Address" section
- Includes verification button
- Shows "Status: Pending verification"
- Hides login button

**When verification not required:**
- Shows "You're all set! You can now access your account"
- Shows "Status: Active"
- Shows login button

## Testing

1. Register a new account with email verification enabled
2. **Should receive only 1 welcome email**
3. Email should contain verification link
4. Email should indicate "Pending verification" status

## Related

- **RESEND_VERIFICATION_FIX.md** - Fix for resend verification endpoint
- Better-Auth hooks in `server/lib/auth.ts`

## Date

Fixed: January 13, 2026
