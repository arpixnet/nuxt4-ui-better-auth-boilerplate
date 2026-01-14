<script setup lang="ts">
import { authConfig } from '~/config/auth.config'

// Auth configuration
const authPageConfig = authConfig

// Form state
const formState = ref({
  email: '',
})
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

// Validate form in real-time
const isEmailValid = computed(() => {
  if (!formState.value.email) return true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(formState.value.email)
})

const isFormValid = computed(() => {
  return isEmailValid.value && formState.value.email
})

/**
 * Handle forgot password request
 */
const handleForgotPassword = async (event: Event) => {
  // Prevent form from reloading the page
  event.preventDefault()
  
  error.value = null
  success.value = false
  loading.value = true

  console.log('[Forgot-Password] Submitting password reset request for:', formState.value.email)

  try {
    // Call Better-Auth server endpoint directly
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formState.value.email,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      if (data.success) {
        success.value = true
        console.log('[Forgot-Password] ✅ Password reset email sent successfully')
        
        // Redirect to check-reset-email page for better UX
        setTimeout(() => {
          navigateTo(`/auth/check-reset-email?email=${encodeURIComponent(formState.value.email)}`)
        }, 1000)
      } else {
        throw new Error(data.message || 'Failed to send reset email')
      }
    } else {
      // Handle rate limiting error
      if (response.status === 429) {
        const resetIn = data.data?.resetAt
          ? Math.ceil((data.data.resetAt * 1000 - Date.now()) / 1000 / 60)
          : 60
        throw new Error(`Too many requests. Please try again in ${resetIn} minute${resetIn !== 1 ? 's' : ''}.`)
      }
      throw new Error(data.message || 'Failed to send reset email')
    }
  } catch (err: any) {
    console.error('[Forgot-Password] ❌ Error:', err)
    error.value = err.message || 'An error occurred. Please try again.'
    // Show error for 3 seconds then clear it
    setTimeout(() => {
      error.value = null
    }, 3000)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="mb-6 text-center">
        <NuxtLink to="/">
          <img
            v-if="authPageConfig.logo.imageUrl"
            :src="authPageConfig.logo.imageUrl"
            :alt="authPageConfig.logo.imageAlt || 'Logo'"
            class="h-10 mx-auto"
          />
          <h2
            v-else
            :class="[
              'font-bold text-gray-900 dark:text-white tracking-tight',
              `text-${authPageConfig.logo.size}`
            ]"
          >
            {{ authPageConfig.logo.text }}
          </h2>
        </NuxtLink>
      </div>

      <!-- Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8">
        <!-- Avatar Circle -->
        <AuthAvatar icon="heroicons:lock-closed-solid" align="center" class="mb-5" />

        <!-- Header -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Forgot Password?
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password.
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
          description="If an account exists with this email, we've sent a password reset link."
          color="success"
          variant="subtle"
          icon="heroicons:check-circle-20-solid"
          class="mb-6"
        />

        <!-- Form -->
        <form @submit="handleForgotPassword">
          <!-- Email Input -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email address
            </label>
            <UInput
              v-model="formState.email"
              type="email"
              placeholder="Enter your email address"
              size="lg"
              :disabled="loading || success"
              autofocus
              :color="formState.email && !isEmailValid ? 'error' : undefined"
              class="w-full"
            >
              <template #leading>
                <Icon name="heroicons:envelope-20-solid" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </template>
            </UInput>
            <p v-if="formState.email && !isEmailValid" class="text-red-500 text-xs mt-1.5">
              Please enter a valid email address
            </p>
          </div>

          <!-- Submit Button -->
          <UButton
            type="submit"
            color="primary"
            variant="solid"
            size="lg"
            block
            :loading="loading"
            :disabled="loading || success || !isFormValid"
            class="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-semibold shadow-md shadow-gray-200/50 dark:shadow-gray-900/50 transition-all duration-200 cursor-pointer mb-4"
          >
            <span v-if="!loading" class="flex items-center justify-center gap-2">
              Send Reset Link
              <Icon name="heroicons:arrow-right-20-solid" class="w-4 h-4" />
            </span>
            <span v-else>Sending...</span>
          </UButton>

          <!-- Back to Login -->
          <div class="text-center mt-4">
            <UButton
              to="/auth/login"
              variant="link"
              color="neutral"
            >
              ← Back to Sign In
            </UButton>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="mt-4 text-center">
        <p class="text-xs text-gray-400 dark:text-gray-500">
          Secure password reset powered by {{ authPageConfig.logo.text }}
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          © {{ new Date().getFullYear() }} {{ authPageConfig.logo.text }}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>
