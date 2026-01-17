# Composables Documentation

Complete reference for all composables included in the boilerplate.

---

## Table of Contents

- [Overview](#overview)
- [Authentication Composables](#authentication-composables)
- [Utility Composables](#utility-composables)
- [Creating Custom Composables](#creating-custom-composables)
- [Best Practices](#best-practices)

---

## Overview

Composables are reusable functions that leverage Vue's Composition API. In Nuxt, composables in `app/composables/` are **auto-imported** and can be used in components, pages, and other composables.

### Auto-Import

```vue
<script setup lang="ts">
// No import needed - composables are auto-imported
const { session, pending } = useAuthSession()
</script>
```

---

## Authentication Composables

### useAuthClient

**Location:** `app/lib/auth-client.ts`

Singleton Better-Auth client instance for authentication operations.

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `authClient` | `AuthClient` | Better-Auth client instance |

#### Available Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `signIn.email()` | `{ email, password, callbackURL }` | `Promise<Session>` | Sign in with email/password |
| `signIn.social()` | `{ provider, callbackURL }` | `Promise<void>` | Sign in with OAuth provider |
| `signUp.email()` | `{ email, password, name, callbackURL }` | `Promise<Session>` | Register new user |
| `signOut()` | - | `Promise<void>` | Sign out user |
| `getSession()` | - | `Promise<SessionRef>` | Get current session |
| `getJWT()` | - | `Promise<string>` | Get JWT token |

#### Usage

```vue
<script setup lang="ts">
const authClient = useAuthClient()

const login = async () => {
  const response = await authClient.signIn.email({
    email: 'user@example.com',
    password: 'password123',
    callbackURL: '/dashboard'
  })

  if (response.error) {
    console.error('Login failed:', response.error)
  } else {
    console.log('Logged in:', response.data)
  }
}

const logout = async () => {
  await authClient.signOut()
  await navigateTo('/auth/login')
}
</script>
```

#### Important Notes

**Must be called from within a valid Nuxt context:**

- ✅ Vue component's `<script setup>`
- ✅ Nuxt plugin
- ✅ Another composable
- ❌ Top-level of module files
- ❌ Outside of Nuxt context

#### TypeScript Types

```typescript
import type { AuthClient } from '~/lib/auth-client'

// Get client instance
const authClient = useAuthClient() as AuthClient
```

---

### useAuthSession

**Location:** `app/composables/useAuthSession.ts`

Reactive session management with automatic expiration detection and redirect.

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `session` | `Ref<AuthSession>` | Reactive session data |
| `pending` | `Ref<boolean>` | Loading state |
| `error` | `Ref<Error \| null>` | Error if any |
| `refresh` | `() => Promise<void>` | Reload session function |
| `isExpired` | `ComputedRef<boolean>` | Session expiration status |

#### Types

```typescript
interface User {
  id: string
  email: string
  name?: string
  emailVerified: boolean
  image?: string
  createdAt: Date
  updatedAt: Date
}

interface Session {
  id: string
  userId: string
  expiresAt: Date
  token: string
  ipAddress?: string
  userAgent?: string
}

interface AuthSessionData {
  user: User
  session: Session
}

interface AuthSession {
  data: AuthSessionData | null
  error: Error | null
}
```

#### Usage

```vue
<script setup lang="ts">
const { session, pending, isExpired } = useAuthSession()

// Access user data
const userName = computed(() => session.value?.data?.user?.name)
const userEmail = computed(() => session.value?.data?.user?.email)

// Check authentication state
const isAuthenticated = computed(() => session.value?.data !== null)

// Show loading state
if (pending.value) {
  // Show spinner
}

// Check expiration
watch(isExpired, (expired) => {
  if (expired) {
    console.log('Session expired!')
    // Auto-redirect to login is handled automatically
  }
})
</script>

<template>
  <div>
    <div v-if="pending">Loading session...</div>
    <div v-else-if="isExpired">Session expired. Redirecting...</div>
    <div v-else-if="isAuthenticated">
      <p>Welcome, {{ session.data.user.name }}!</p>
      <p>{{ session.data.user.email }}</p>
    </div>
    <div v-else>
      <p>Not authenticated</p>
    </div>
  </div>
</template>
```

#### Features

- **Auto-redirect on expiration:** Automatically redirects to `/auth/login` when session expires
- **Reactive:** Session data updates automatically when changed
- **Pending state:** Prevents flickering between auth states on page load
- **Refresh function:** Manually reload session when needed

---

### useAuthConfig

**Location:** `app/composables/useAuthConfig.ts`

Access authentication page configuration for customizing login/register appearance.

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `config` | `AuthPageConfig` | Full configuration object |
| `getLogo()` | `() => LogoConfig` | Get logo configuration |
| `getDecorativePanel()` | `(page) => PanelConfig` | Get panel config for a page |
| `getGradientStyle()` | `(page, mode) => CSSProperties` | Get gradient CSS styles |

#### Usage

```vue
<script setup lang="ts">
const { config, getDecorativePanel, getGradientStyle } = useAuthConfig()

// Get login panel configuration
const loginPanel = getDecorativePanel('login')
const registerPanel = getDecorativePanel('register')

// Get gradient styles
const loginGradient = computed(() => getGradientStyle('login', 'dark'))
</script>

<template>
  <div
    :style="loginGradient"
    class="p-8"
  >
    <h1>{{ loginPanel.title }}</h1>
    <p>{{ loginPanel.subtitle }}</p>
  </div>
</template>
```

#### Customization Guide

For complete customization options, see [Auth Configuration Documentation](./AUTH_CONFIG.md).

---

## Utility Composables

### useEmailRateLimit

**Location:** `app/composables/useEmailRateLimit.ts`

Rate limiting for email operations with Redis fallback to in-memory storage.

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `isAllowed` | `(identifier) => Promise<boolean>` | Check if action is allowed |
| `checkLimit()` | `(identifier) => Promise<boolean>` | Alias for isAllowed |
| `resetLimit()` | `(identifier) => Promise<void>` | Reset rate limit |

#### Configuration

Configured via environment variables:

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional-password
```

#### Usage

```vue
<script setup lang="ts">
const { isAllowed, resetLimit } = useEmailRateLimit()

const sendVerificationEmail = async (email: string) => {
  // Check if email can be sent
  const allowed = await isAllowed(email)

  if (!allowed) {
    showError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.'
    })
    return
  }

  // Send email...
  await $fetch('/api/email/send-verification', {
    method: 'POST',
    body: { userEmail: email }
  })
}

const resetEmailLimit = async (email: string) => {
  await resetLimit(email)
}
</script>
```

#### Rate Limit Behavior

- **Window:** 1 hour
- **Max attempts:** 3 per email address
- **Fallback:** In-memory if Redis unavailable

---

### useSessionMonitor

**Location:** `app/composables/useSessionMonitor.ts`

Monitors session expiration and handles auto-logout with notifications.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options.onExpired` | `() => void` | `() => {}` | Callback when session expires |
| `options.warningMinutes` | `number` | `5` | Show warning X minutes before expiration |
| `options.checkInterval` | `number` | `60000` | Check interval in milliseconds |

#### Usage

```vue
<script setup lang="ts>
const { session } = useAuthSession()

useSessionMonitor({
  onExpired: () => {
    // Handle session expiration
    navigateTo('/auth/login')
  },
  warningMinutes: 5,
  checkInterval: 30000 // Check every 30 seconds
})
</script>
```

#### Features

- **Periodic checks:** Verifies session expiration at intervals
- **Warning notification:** Alerts user before session expires
- **Auto-logout:** Handles expiration automatically

---

## Creating Custom Composables

### Basic Pattern

```typescript
// app/composables/useMyFeature.ts
export const useMyFeature = () => {
  // Reactive state
  const count = ref(0)
  const double = computed(() => count.value * 2)

  // Methods
  const increment = () => {
    count.value++
  }

  const reset = () => {
    count.value = 0
  }

  // Return public API
  return {
    count,
    double,
    increment,
    reset
  }
}
```

### Using Nuxt Composables

```typescript
// app/composables/useUserData.ts
export const useUserData = () => {
  const { session } = useAuthSession()

  const user = computed(() => session.value?.data?.user)

  const isAdmin = computed(() => user.value?.role === 'admin')

  const initials = computed(() => {
    const name = user.value?.name || ''
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  })

  return {
    user,
    isAdmin,
    initials
  }
}
```

### Async Operations

```typescript
// app/composables/useFetchData.ts
export const useFetchData = () => {
  const data = ref(null)
  const pending = ref(false)
  const error = ref(null)

  const fetch = async (url: string) => {
    pending.value = true
    error.value = null

    try {
      const response = await $fetch(url)
      data.value = response
    } catch (e) {
      error.value = e
    } finally {
      pending.value = false
    }
  }

  return {
    data,
    pending,
    error,
    fetch
  }
}
```

### With Parameters

```typescript
// app/composables/useLocalStorage.ts
export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const stored = localStorage.getItem(key)

  const value = ref<T>(stored ? JSON.parse(stored) : defaultValue)

  watch(value, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue))
  }, { deep: true })

  return value
}
```

Usage:

```vue
<script setup lang="ts">
const preferences = useLocalStorage('prefs', {
  theme: 'light',
  language: 'en'
})
</script>
```

---

## Best Practices

### 1. Naming Convention

Use `use` prefix for composables:

```typescript
// ✅ Good
useAuthSession()
useUserData()
useLocalStorage()

// ❌ Avoid
getAuthSession()
userData()
localStorage()
```

### 2. Return Reactive Objects

Always return refs and computeds, not values:

```typescript
// ✅ Good - Returns refs
export const useMyFeature = () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  return { count, double }
}

// ❌ Bad - Returns values
export const useMyFeature = () => {
  const count = ref(0)
  return {
    count: count.value,  // Loses reactivity!
    double: count.value * 2
  }
}
```

### 3. Compose Composables

Build complex functionality by combining composables:

```typescript
// app/composables/useAuthenticatedUser.ts
export const useAuthenticatedUser = () => {
  const { session } = useAuthSession()
  const { isAdmin } = useAuthCheck()

  const user = computed(() => session.value?.data?.user)

  return {
    user,
    isAdmin: isAdmin(user.value?.id),
    isVerified: computed(() => user.value?.emailVerified)
  }
}
```

### 4. Clean Up Side Effects

Use `onUnmounted` for cleanup:

```typescript
export const useInterval = (callback: () => void, delay: number) => {
  const interval = setInterval(callback, delay)

  onUnmounted(() => {
    clearInterval(interval)
  })

  return interval
}
```

### 5. Type Exports

Export types for consumers:

```typescript
export interface UseMyFeatureReturn {
  count: Ref<number>
  double: ComputedRef<number>
  increment: () => void
}

export const useMyFeature = (): UseMyFeatureReturn => {
  // ...
}
```

### 6. Lazy Initialization

Don't run expensive operations until needed:

```typescript
export const useExpensiveData = () => {
  const data = ref(null)
  let loaded = false

  const load = async () => {
    if (loaded) return
    loaded = true
    data.value = await expensiveOperation()
  }

  return {
    data,
    load
  }
}
```

---

## Built-in Nuxt Composables

The boilerplate includes access to all Nuxt composables:

| Composable | Description |
|------------|-------------|
| `useRuntimeConfig()` | Access runtime configuration |
| `useRouter()` | Access Vue Router |
| `useRoute()` | Access current route |
| `useFetch()` | Reactive data fetching |
| `useAsyncData()` | Async data with state |
| `useCookie()` | Cookie management |
| `useHead()` | Manage head tags |
| `useSeoMeta()` | SEO meta tags |
| `useI18n()` | Internationalization |
| `useToast()` | Toast notifications |

See [Nuxt Composables Documentation](https://nuxt.com/docs/getting-started/composables) for complete reference.

---

## References

- [Nuxt Composables Documentation](https://nuxt.com/docs/getting-started/composables)
- [Vue Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Better-Auth Client](https://better-auth.com/docs)
