<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useAuthClient } from '~/lib/auth-client'
import { useAuthSession } from '~/composables/useAuthSession'

const authClient = useAuthClient()
const { session, pending, refresh } = useAuthSession()
const { t } = useI18n()
const router = useRouter()

// Estado de carga para logout
const logoutLoading = ref(false)

// Comprobar si el usuario está autenticado
const isAuthenticated = computed(() => session.value.data?.user && !pending.value)

// Obtener el usuario de la sesión
const user = computed(() => {
  if (!session.value) {
    return null
  }

  const sessionData = session.value as any

  // Estructura 1: { user, session }
  if (sessionData?.user) {
    return sessionData.user
  }

  // Estructura 2: Direct user object
  if (sessionData?.name || sessionData?.email || sessionData?.id) {
    return sessionData
  }

  // Estructura 3: { data: { user } }
  if (sessionData?.data?.user) {
    return sessionData.data.user
  }

  return null
})

// Inicial del usuario en mayúscula
const userInitial = computed(() => {
  if (!user.value?.name) {
    return null
  }
  return user.value.name.charAt(0).toUpperCase()
})

// Items del dropdown de usuario
const userMenuItems = computed<DropdownMenuItem[]>(() => [
  {
    label: user.value?.name || t('common.user'),
    avatar: user.value?.image ? {
      src: user.value.image
    } : undefined,
    type: 'label' as const
  },
  {
    label: user.value?.email || '',
    type: 'label' as const,
    class: 'text-muted text-xs'
  },
  {
    type: 'separator' as const
  },
  {
    label: t('header.goToProfile'),
    icon: 'i-heroicons-user',
    to: '/profile'
  },
  {
    label: logoutLoading.value ? t('logout.loggingOut') : t('common.logout.button'),
    icon: 'i-heroicons-arrow-right-on-rectangle',
    color: 'error' as const,
    disabled: logoutLoading.value,
    loading: logoutLoading.value,
    onSelect: handleLogout
  }
])

// Hacer logout
async function handleLogout() {
  logoutLoading.value = true

  try {
    await authClient.signOut()
    await refresh()
    router.push('/auth/login')
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    logoutLoading.value = false
  }
}
</script>

<template>
  <!-- Estado NO autenticado: Botones de Login/Register -->
  <div v-if="!isAuthenticated" class="flex items-center gap-2">
    <UButton
      to="/auth/login"
      variant="ghost"
      color="neutral"
      size="md"
    >
      {{ t('common.login') }}
    </UButton>
    <UButton
      to="/auth/register"
      color="primary"
      variant="solid"
      size="md"
    >
      {{ t('common.register') }}
    </UButton>
  </div>

  <!-- Estado Autenticado: Avatar con Dropdown -->
  <UDropdownMenu v-else :items="userMenuItems">
    <UButton
      color="neutral"
      variant="ghost"
      size="md"
      class="p-1"
    >
      <!-- Avatar circular -->
      <UAvatar
        v-if="user?.image"
        :src="user.image"
        :alt="user.name || t('common.user')"
        size="md"
      />
      <div
        v-else-if="userInitial"
        class="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm"
      >
        {{ userInitial }}
      </div>
      <div
        v-else
        class="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
      >
        <UIcon name="i-heroicons-user" class="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </div>
    </UButton>
  </UDropdownMenu>
</template>
