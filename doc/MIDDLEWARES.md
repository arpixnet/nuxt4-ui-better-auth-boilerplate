# Middlewares Documentation

Guide for understanding and using route and server middleware in the boilerplate.

---

## Table of Contents

- [Overview](#overview)
- [Route Middleware](#route-middleware)
- [Server Middleware](#server-middleware)
- [Creating Custom Middleware](#creating-custom-middleware)
- [Best Practices](#best-practices)

---

## Overview

Nuxt provides two types of middleware:

1. **Route Middleware** - Runs before navigating to a route (client-side)
2. **Server Middleware** - Runs on the server before the request is processed

---

## Route Middleware

Route middleware runs before navigation to protect routes, redirect users, or perform checks.

### Location

All route middleware files are in `app/middleware/`.

### Built-in Middleware

#### `auth.ts`

Protects routes that require authentication. Redirects unauthenticated users to login.

**Location:** `app/middleware/auth.ts`

```typescript
export default defineNuxtRouteMiddleware((to) => {
  const { session, pending } = useAuthSession()

  // Wait for session to load
  if (pending.value) {
    return
  }

  // Redirect to login if not authenticated
  if (!session.value?.data) {
    return navigateTo(`/auth/login?redirect=${to.fullPath}`)
  }
})
```

**Usage in pages:**

```vue
<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
</script>

<template>
  <div>
    <h1>Protected Page</h1>
    <!-- Only accessible when logged in -->
  </div>
</template>
```

**Multiple middleware:**

```vue
<script setup lang="ts)
definePageMeta({
  middleware: ['auth', 'verify-email']
})
</script>
```

---

#### `register-allowed.ts`

Controls access to the registration page based on the `ALLOW_REGISTRATION` environment variable.

**Location:** `app/middleware/register-allowed.ts`

```typescript
export default defineNuxtRouteMiddleware(() => {
  const config = useRuntimeConfig()
  const allowRegistration = config.public.allowRegistration

  if (!allowRegistration) {
    // Return 404 if registration is disabled
    return abortNavigation('Page not found')
  }
})
```

**Usage:**

```vue
<script setup lang="ts">
definePageMeta({
  middleware: 'register-allowed'
})
</script>
```

**Environment variable:**

```bash
# .env
ALLOW_REGISTRATION=false  # Registration page returns 404
```

---

### Middleware Execution Order

Middleware runs in the order they are defined in `definePageMeta`:

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['first', 'second', 'third']
})
</script>
```

1. `first` middleware runs
2. If it doesn't abort, `second` runs
3. If it doesn't abort, `third` runs
4. Page loads

---

### Anonymous Middleware

Define middleware directly in the page component:

```vue
<script setup lang="ts">
definePageMeta({
  middleware: defineNuxtRouteMiddleware((to) => {
    // Inline middleware logic
    if (to.params.id === 'special') {
      return navigateTo('/special-route')
    }
  })
})
</script>
```

---

## Server Middleware

Server middleware runs on every server request before the route handler.

### Location

All server middleware files are in `server/middleware/`.

### Creating Server Middleware

**Example: Logging middleware**

```typescript
// server/middleware/logger.ts
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const method = getRequestMethod(event)
  const startTime = Date.now()

  console.log(`[${method}] ${url}`)

  // Log response time when request completes
  event.context.startTime = startTime
})
```

**Example: CORS middleware**

```typescript
// server/middleware/cors.ts
export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  })

  if (getMethod(event) === 'OPTIONS') {
    event.node.res.statusCode = 204
    event.node.res.end()
    return
  }
})
```

**Example: Auth check for API routes**

```typescript
// server/middleware/api-auth.ts
export default defineEventHandler(async (event) => {
  // Only apply to /api routes
  if (!event.node.req.url?.startsWith('/api/')) {
    return
  }

  // Skip auth endpoints
  if (event.node.req.url?.startsWith('/api/auth/')) {
    return
  }

  // Check for session cookie
  const sessionToken = getCookie(event, 'better-auth.session_token')

  if (!sessionToken) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  // Validate session...
})
```

---

## Creating Custom Middleware

### Route Middleware Pattern

**Creating a role-based middleware:**

```typescript
// app/middleware/admin.ts
export default defineNuxtRouteMiddleware((to) => {
  const { session } = useAuthSession()

  // Check if user has admin role
  const userRole = session.value?.data?.user?.role

  if (userRole !== 'admin') {
    return navigateTo('/unauthorized')
  }
})
```

**Usage:**

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})
</script>
```

---

### Middleware with Parameters

Pass data to middleware using meta:

```vue
<script setup lang="ts">
// Page with required permission
definePageMeta({
  middleware: ['permission'],
  requiredPermission: 'users.write'
})
</script>
```

```typescript
// app/middleware/permission.ts
export default defineNuxtRouteMiddleware((to) => {
  const { session } = useAuthSession()
  const requiredPermission = to.meta.requiredPermission

  const hasPermission = session.value?.data?.user?.permissions?.includes(
    requiredPermission
  )

  if (!hasPermission) {
    return navigateTo('/forbidden')
  }
})
```

---

### Named Middleware with Guards

```typescript
// app/middleware/verified.ts
export default defineNuxtRouteMiddleware((to) => {
  const { session } = useAuthSession()

  const isVerified = session.value?.data?.user?.emailVerified

  if (!isVerified) {
    return navigateTo('/auth/verify-email')
  }
})
```

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'verified']
})
</script>
```

---

## Best Practices

### 1. Keep Middleware Simple

Middleware should be focused and do one thing well.

```typescript
// ✅ Good - Single responsibility
export default defineNuxtRouteMiddleware(() => {
  const { session } = useAuthSession()
  if (!session.value?.data) return navigateTo('/login')
})

// ❌ Bad - Too many concerns
export default defineNuxtRouteMiddleware(() => {
  const { session } = useAuthSession()
  if (!session.value?.data) return navigateTo('/login')
  if (session.value.data.user.role !== 'admin') return navigateTo('/forbidden')
  if (session.value.data.user.banned) return navigateTo('/suspended')
  // Also checking subscription status...
  // Also checking geolocation...
})
```

### 2. Use Composables for Reusable Logic

Extract business logic to composables:

```typescript
// composables/useAuthCheck.ts
export const useAuthCheck = () => {
  const { session } = useAuthSession()

  const isAuthenticated = computed(() => !!session.value?.data)
  const isVerified = computed(() => session.value?.data?.user?.emailVerified)
  const isAdmin = computed(() => session.value?.data?.user?.role === 'admin')

  return {
    isAuthenticated,
    isVerified,
    isAdmin
  }
}
```

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useAuthCheck()

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
```

### 3. Handle Loading States

For async middleware, show loading indicators:

```typescript
// app/middleware/load-user.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { session, pending } = useAuthSession()

  // Wait for session
  if (pending.value) {
    // Show loading state
    return
  }

  // Load additional user data
  if (session.value?.data?.user?.id) {
    const userId = session.value.data.user.id
    // Fetch user-specific data...
  }
})
```

### 4. Preserve Query Parameters

When redirecting, preserve original query params:

```typescript
export default defineNuxtRouteMiddleware((to) => {
  const { session } = useAuthSession()

  if (!session.value?.data) {
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    })
  }
})
```

Then redirect back after login:

```typescript
// In login component after successful login
const redirect = query.redirect || '/'
await navigateTo(redirect)
```

### 5. Use Proper HTTP Status Codes

For server middleware errors:

```typescript
export default defineEventHandler((event) => {
  // Unauthorized
  throw createError({
    statusCode: 401,
    message: 'Authentication required'
  })

  // Forbidden
  throw createError({
    statusCode: 403,
    message: 'Insufficient permissions'
  })

  // Not Found
  throw createError({
    statusCode: 404,
    message: 'Resource not found'
  })
})
```

---

## Common Patterns

### Protected Routes Pattern

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { session, pending } = useAuthSession()

  if (pending.value) return

  if (!session.value?.data) {
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
```

### Role-Based Access Control

```typescript
// middleware/role.ts
export default defineNuxtRouteMiddleware((to) => {
  const { session } = useAuthSession()
  const requiredRole = to.meta.role as string

  const userRole = session.value?.data?.user?.role

  if (userRole !== requiredRole) {
    return navigateTo('/forbidden')
  }
})
```

### Email Verification Pattern

```typescript
// middleware/verified.ts
export default defineNuxtRouteMiddleware((to) => {
  const { session } = useAuthSession()

  // Skip verification check for verification page itself
  if (to.path === '/auth/verify-email') return

  const isVerified = session.value?.data?.user?.emailVerified

  if (!isVerified) {
    return navigateTo('/auth/verify-email')
  }
})
```

---

## References

- [Nuxt Route Middleware Documentation](https://nuxt.com/docs/getting-started/views#route-middleware)
- [Nuxt Server Middleware Documentation](https://nuxt.com/docs/guide/directory-structure/server#server-middleware)
- [Vue Router Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html)
