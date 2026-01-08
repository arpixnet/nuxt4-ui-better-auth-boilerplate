<script setup lang="ts">
import { useAuthClient } from '~/lib/auth-client'
import { navigateTo } from '#app'
import { useAuthSession } from '~/composables/useAuthSession'

const authClient = useAuthClient()
const { session, refresh } = useAuthSession()

const loading = ref(false)
const error = ref<string | null>(null)

// Debug: log session structure
console.log('AuthLogout - Session:', session.value)

// Computed property to safely extract user from session
const user = computed(() => {
  if (!session.value) return null
  
  // Try different possible structures
  const sessionData = session.value as any
  
  // Structure 1: { user, session }
  if (sessionData?.user) {
    return sessionData.user
  }
  
  // Structure 2: Direct user object
  if (sessionData?.name || sessionData?.email || sessionData?.id) {
    return sessionData
  }
  
  // Structure 3: { data: { user } }
  if (sessionData?.data?.user) {
    return sessionData.data.user
  }
  
  return null
})

/**
 * Handle user logout
 */
const handleLogout = async () => {
  loading.value = true
  error.value = null
  
  try {
    await authClient.signOut()
    
    // Refresh session to clear it
    await refresh()
    
    // Redirect to login page
    navigateTo('/auth/login')
  } catch (err) {
    console.error('Logout error:', err)
    error.value = 'Failed to sign out. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Debug Info -->
    <div class="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
      <p class="font-bold text-yellow-800">Debug AuthLogout:</p>
      <p class="text-sm text-yellow-700">Session exists: {{ !!session }}</p>
      <p class="text-sm text-yellow-700">User extracted: {{ !!user }}</p>
      <details class="mt-2">
        <summary class="cursor-pointer text-sm font-mono">Session Data:</summary>
        <pre class="mt-2 text-xs bg-yellow-100 p-2 rounded">{{ JSON.stringify(session, null, 2) }}</pre>
      </details>
    </div>

    <!-- Actual Logout UI -->
    <div v-if="user" class="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <!-- Error Alert -->
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="heroicons:exclamation-triangle-20-solid"
        class="mb-4"
      >
        {{ error }}
      </UAlert>

      <div class="flex items-center justify-between gap-4">
        <!-- User Info -->
        <div class="flex items-center gap-3">
          <UAvatar
            :src="user.image || undefined"
            :alt="user.name || 'User'"
            size="md"
          />
          <div>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ user.name || 'User' }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ user.email }}
            </p>
          </div>
        </div>

        <!-- Logout Button -->
        <UButton
          icon="heroicons:arrow-right-on-rectangle-20-solid"
          :loading="loading"
          :disabled="loading"
          color="error"
          variant="soft"
          @click="handleLogout"
        >
          Sign out
        </UButton>
      </div>
    </div>
  </div>
</template>
