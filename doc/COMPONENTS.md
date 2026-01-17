# Components Documentation

Complete reference for all reusable components included in the boilerplate.

---

## Table of Contents

- [Layout Components](#layout-components)
- [Auth Components](#auth-components)
- [Layouts](#layouts)
- [Customizing Components](#customizing-components)

---

## Layout Components

Components used in the main application layout.

### AppHeader

**Location:** `app/components/layout/AppHeader.vue`

The main navigation header with logo, navigation links, and user menu.

#### Props

None (uses runtime config for app name).

#### Features

- Responsive navigation with mobile menu
- Dark mode toggle
- Auth/unauth states
- User avatar dropdown

#### Usage

```vue
<template>
  <div>
    <AppHeader />
    <main>
      <slot />
    </main>
  </div>
</template>
```

#### Customization

To customize the header, modify `app/components/layout/AppHeader.vue`:

```vue
<template>
  <header class="border-b border-gray-200 dark:border-gray-800">
    <UContainer>
      <div class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <Logo />
          <span class="font-bold">{{ $t('app.name') }}</span>
        </NuxtLink>

        <!-- Navigation -->
        <nav class="hidden md:flex items-center gap-6">
          <NuxtLink to="/about">{{ $t('nav.about') }}</NuxtLink>
          <NuxtLink to="/contact">{{ $t('nav.contact') }}</NuxtLink>
        </nav>

        <!-- User Menu -->
        <AuthUser />
      </div>
    </UContainer>
  </header>
</template>
```

---

### AppFooter

**Location:** `app/components/layout/AppFooter.vue`

Site footer with links and copyright information.

#### Props

None.

#### Features

- Multi-column layout
- Copyright with dynamic year
- Social links (optional)
- Legal links (privacy, terms)

#### Usage

```vue
<template>
  <div>
    <main>
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
```

#### Customization

```vue
<template>
  <footer class="bg-gray-50 dark:bg-gray-900 mt-auto">
    <UContainer>
      <div class="py-8">
        <!-- Logo and description -->
        <div class="mb-6">
          <Logo />
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {{ $t('app.description') }}
          </p>
        </div>

        <!-- Links columns -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Product -->
          <div>
            <h3 class="font-semibold mb-3">{{ $t('footer.product') }}</h3>
            <ul class="space-y-2">
              <li><NuxtLink to="/features">{{ $t('footer.features') }}</NuxtLink></li>
              <li><NuxtLink to="/pricing">{{ $t('footer.pricing') }}</NuxtLink></li>
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h3 class="font-semibold mb-3">{{ $t('footer.company') }}</h3>
            <ul class="space-y-2">
              <li><NuxtLink to="/about">{{ $t('footer.about') }}</NuxtLink></li>
              <li><NuxtLink to="/contact">{{ $t('footer.contact') }}</NuxtLink></li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h3 class="font-semibold mb-3">{{ $t('footer.legal') }}</h3>
            <ul class="space-y-2">
              <li><NuxtLink to="/privacy">{{ $t('footer.privacy') }}</NuxtLink></li>
              <li><NuxtLink to="/terms">{{ $t('footer.terms') }}</NuxtLink></li>
            </ul>
          </div>
        </div>

        <!-- Copyright -->
        <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {{ new Date().getFullYear() }} {{ appName }}. All rights reserved.</p>
        </div>
      </div>
    </UContainer>
  </footer>
</template>
```

---

### AuthUser

**Location:** `app/components/layout/AuthUser.vue`

Displays the authenticated user menu with avatar and dropdown options.

#### Props

None.

#### Features

- User avatar with fallback
- Dropdown menu with:
  - Profile link
  - Settings link
  - Logout button
- JWT token display with copy function

#### Usage

```vue
<template>
  <div>
    <AuthUser />
  </div>
</template>
```

#### Dropdown Items

The component includes these menu items by default:

| Item | Route | Description |
|------|-------|-------------|
| Profile | `/profile` | User profile page |
| Logout | - | Signs out user |

#### Customizing Menu Items

Edit `app/components/layout/AuthUser.vue` to add/remove items:

```vue
<template>
  <UDropdown :items="items">
    <template #default="{ open }">
      <UButton
        color="white"
        variant="ghost"
        :label="userName"
        :avatar="{ src: userImage }"
      />
    </template>
  </UDropdown>
</template>

<script setup lang="ts">
const { session } = useAuthSession()

const items = computed(() => [
  [{
    label: 'Profile',
    icon: 'i-heroicons-user',
    click: () => navigateTo('/profile')
  }],
  [{
    label: 'Settings',  // Custom item
    icon: 'i-heroicons-cog',
    click: () => navigateTo('/settings')
  }, {
    label: 'Billing',    // Custom item
    icon: 'i-heroicons-credit-card',
    click: () => navigateTo('/billing')
  }],
  [{
    label: 'Sign out',
    icon: 'i-heroicons-arrow-left-on-rectangle',
    click: async () => {
      const authClient = useAuthClient()
      await authClient.signOut()
      await navigateTo('/auth/login')
    }
  }]
])
</script>
```

---

### LanguageSelector

**Location:** `app/components/layout/languageSelector.vue`

Dropdown component for switching between available languages.

#### Props

None.

#### Features

- Lists all configured i18n locales
- Shows flag emoji and language name
- Persists selection in cookie

#### Usage

```vue
<template>
  <div>
    <LayoutLanguageSelector />
  </div>
</template>
```

#### Customization

To customize the display, edit the component:

```vue
<template>
  <USelect
    v-model="selectedLocale"
    :options="localeOptions"
    value-attribute="code"
    option-attribute="name"
    @change="setLocale(selectedLocale)"
  >
    <template #label="{ option }">
      <span class="flex items-center gap-2">
        <span>{{ option.flag }}</span>
        <span>{{ option.shortName }}</span>
      </span>
    </template>
  </USelect>
</template>
```

---

## Auth Components

Components specifically for authentication pages.

### AuthAvatar

**Location:** `app/components/AuthAvatar.vue`

Displays user avatar with fallback to initials.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `user` | `object` | `null` | User object with `name` and `image` |
| `size` | `string` | `'md'` | Avatar size: `sm`, `md`, `lg`, `xl` |

#### Usage

```vue
<template>
  <AuthAvatar
    :user="{ name: 'John Doe', image: '/avatar.jpg' }"
    size="lg"
  />
</template>
```

#### Fallback Behavior

If no image is provided, displays initials:

```typescript
// "John Doe" -> "JD"
// "María García" -> "MG"
```

---

### AuthLogout

**Location:** `app/components/AuthLogout.vue**

Logout button with loading state.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `redirect` | `string` | `'/auth/login'` | Redirect path after logout |

#### Usage

```vue
<template>
  <AuthLogout redirect="/home" />
</template>
```

#### Custom Button

```vue
<template>
  <UButton
    :loading="pending"
    icon="i-heroicons-arrow-left-on-rectangle"
    @click="handleLogout"
  >
    {{ $t('auth.logout') }}
  </UButton>
</template>

<script setup lang="ts">
const props = defineProps<{
  redirect?: string
}>()

const pending = ref(false)
const authClient = useAuthClient()

const handleLogout = async () => {
  pending.value = true
  try {
    await authClient.signOut()
    await navigateTo(props.redirect || '/auth/login')
  } finally {
    pending.value = false
  }
}
</script>
```

---

### UPassword

**Location:** `app/components/UPassword.vue**

Password input field with toggle visibility button.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `''` | Password value (v-model) |
| `placeholder` | `string` | `'••••••••'` | Input placeholder |
| `required` | `boolean` | `false` | Required attribute |
| `autocomplete` | `string` | `'current-password'` | Autocomplete value |

#### Usage

```vue
<template>
  <UPassword
    v-model="password"
    placeholder="Enter your password"
    required
    autocomplete="new-password"
  />
</template>

<script setup lang="ts">
const password = ref('')
</script>
```

#### Features

- Toggle visibility (eye icon)
- Password strength indicator (optional)
- Validation support

---

## Layouts

### Default Layout

**Location:** `app/layouts/default.vue`

Main layout with header and footer.

#### Usage

Applied automatically to all pages unless specified otherwise.

```vue
<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
```

#### Pages Using Default Layout

- `/index.vue`
- `/dashboard.vue`
- `/profile.vue`
- All pages except auth pages

---

### Blank Layout

**Location:** `app/layouts/blank.vue`

Minimal layout without header/footer for auth pages.

#### Usage

Apply to pages that need full-screen or centered content:

```vue
<template>
  <div class="min-h-screen flex items-center justify-center">
    <slot />
  </div>
</template>
```

#### Applying to a Page

```vue
<template>
  <div>
    <h1>My Page</h1>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'blank'
})
</script>
```

#### Pages Using Blank Layout

- `/auth/login.vue`
- `/auth/register.vue`
- `/auth/forgot-password.vue`
- `/auth/reset-password.vue`
- `/auth/verify-email.vue`

---

## Customizing Components

### Using Nuxt UI Components

The boilerplate uses [Nuxt UI](https://ui.nuxt.com) components. Refer to their documentation for available components and props.

### Creating Custom Components

1. Create a new component file:

```bash
touch app/components/MyComponent.vue
```

2. Use auto-import (no need to import):

```vue
<template>
  <div>
    <MyComponent />
  </div>
</template>
```

### Component Naming

- Use PascalCase for component names
- Nuxt auto-imports components from `app/components/`
- Nested folders create namespaced components:
  - `components/layout/Header.vue` → `<LayoutHeader />`
  - `components/auth/LoginForm.vue` → `<AuthLoginForm />`

### Props with TypeScript

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  items: string[]
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})
</script>
```

### Slots

```vue
<template>
  <div class="card">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>
```

Usage:

```vue
<MyComponent>
  <template #header>
    <h2>Title</h2>
  </template>
  <p>Body content</p>
  <template #footer>
    <button>Action</button>
  </template>
</MyComponent>
```

---

## References

- [Nuxt Components Documentation](https://nuxt.com/docs/getting-started/views#components)
- [Nuxt UI Components](https://ui.nuxt.com/components)
- [Vue Component Guide](https://vuejs.org/guide/essentials/component-basics.html)
