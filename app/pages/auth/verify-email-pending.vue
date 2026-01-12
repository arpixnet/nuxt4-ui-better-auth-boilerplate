<script setup lang="ts">
import { useRoute, useRouter } from '#app'
import { useRuntimeConfig } from '#app'

// Auth configuration
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

// Get email from URL query parameter
const userEmail = computed(() => {
  const emailFromUrl = route.query.email as string
  return emailFromUrl ? decodeURIComponent(emailFromUrl) : ''
})

const userName = computed(() => userEmail.value.split('@')[0] || 'User')

// Form state
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

/**
 * Resend verification email
 */
const handleResendEmail = async () => {
  error.value = null
  success.value = false
  loading.value = true
  
  const emailToSend = userEmail.value
  console.log('[Verify-Email-Pending] Attempting to resend verification email to:', emailToSend)
  
  try {
    // Call internal API endpoint to resend verification email
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailToSend,
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to resend verification email')
    }
    
    success.value = true
    console.log('[Verify-Email-Pending] Verification email resent successfully')
  } catch (err: any) {
    console.error('[Verify-Email-Pending] Error:', err)
    error.value = err.message || 'Failed to resend verification email. Please try again.'
  } finally {
    loading.value = false
  }
}

/**
 * Go back to login
 */
const goBackToLogin = () => {
  router.push('/auth/login')
}
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="mb-6 text-center">
        <NuxtLink to="/">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {{ config.public.appName }}
          </h2>
        </NuxtLink>
      </div>

      <!-- Card -->
      <UCard>
        <!-- Icon -->
        <div class="flex justify-center mb-6">
          <div class="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <Icon name="heroicons:envelope" class="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <!-- Header -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Email Verification Required
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Please verify your email address to continue
          </p>
          <p class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ userEmail }}
          </p>
        </div>

        <!-- Error Alert -->
        <UAlert
          v-if="error"
          :description="error"
          color="error"
          variant="subtle"
          icon="heroicons:information-circle-20-solid"
          class="mb-6"
        />

        <!-- Success Alert -->
        <UAlert
          v-if="success"
          description="Verification email sent! Please check your inbox."
          color="success"
          variant="subtle"
          icon="heroicons:check-circle-20-solid"
          class="mb-6"
        />

        <!-- Instructions -->
        <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p class="text-sm text-blue-800 dark:text-blue-200 mb-2">
            📧 <strong>Check your email</strong>
          </p>
          <p class="text-sm text-blue-700 dark:text-blue-300">
            We've sent a verification link to your email address. Click the link to verify your account and sign in.
          </p>
        </div>

        <!-- Resend Button -->
        <UButton
          color="primary"
          variant="solid"
          size="lg"
          block
          :loading="loading"
          :disabled="loading || success"
          @click="handleResendEmail"
          class="mb-4"
        >
          <span v-if="!loading">Resend Verification Email</span>
          <span v-else>Sending...</span>
        </UButton>

        <!-- Back to Login -->
        <UButton
          color="gray"
          variant="ghost"
          size="lg"
          block
          @click="goBackToLogin"
        >
          Back to Login
        </UButton>
      </UCard>
    </div>
  </div>
</template>

