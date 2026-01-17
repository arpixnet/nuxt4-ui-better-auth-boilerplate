<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAuthConfig } from '~/composables/useAuthConfig'

const { t } = useI18n()

// Auth configuration para obtener logo
const { config: authPageConfig } = useAuthConfig()

// Estado de autenticación
const { session, pending } = useAuthSession()

// Comprobar si el usuario está autenticado
const isAuthenticated = computed(() => session.value.data?.user && !pending.value)

// Items de navegación según estado de autenticación (sin Profile)
const navItems = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = [
    {
      label: t('common.home'),
      to: '/',
      icon: 'i-heroicons-home'
    }
  ]

  // Agregar Dashboard solo cuando está autenticado
  if (isAuthenticated.value) {
    items.push({
      label: t('common.dashboard'),
      to: '/dashboard',
      icon: 'i-heroicons-chart-bar'
    })
  }

  return items
})
</script>

<template>
  <UHeader>
    <template #title>
      <NuxtLink to="/" class="flex items-center gap-3">
        <img 
          v-if="authPageConfig.logo.imageUrl" 
          :src="authPageConfig.logo.imageUrl"
          :alt="t('header.logo')"
          class="h-6 w-auto" 
        />
        <h2 
          v-else 
          :class="[
            'font-bold tracking-tight text-primary',
            `text-${authPageConfig.logo.size}`
          ]"
        >
          {{ t('header.title') }}
        </h2>
      </NuxtLink>
    </template>

    <!-- Navegación principal (centro - desktop) -->
    <UNavigationMenu :items="navItems" />

    <!-- Derecha: ThemeSelector + LanguageSelector + Auth -->
    <template #right>
      <LayoutThemeSelector />
      <LayoutLanguageSelector />
      <LayoutAuthUser />
    </template>

    <!-- Navegación móvil (body) -->
    <template #body>
      <UNavigationMenu :items="navItems" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
