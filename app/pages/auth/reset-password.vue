<script setup lang="ts">
import { navigateTo, useRoute } from '#app'
import { authConfig } from '~/config/auth.config'

// Auth configuration
const authPageConfig = authConfig

// Route and token
const route = useRoute()
const token = computed(() => route.query.token as string)

// Form state
const formState = ref({
  password: '',
  confirmPassword: '',
})
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

// Validate form in real-time
const isPasswordValid = computed(() => {
  if (!formState.value.password) return true
  return formState.value.password.length >= 8
})

const passwordsMatch = computed(() => {
  if (!formState.value.password || !formState.value.confirmPassword) return true
  return formState.value.password === formState.value.confirmPassword
})

const confirmPasswordError = computed(() => {
  if (formState.value.confirmPassword && !passwordsMatch.value) {
    return 'Passwords do not match'
  }
  return null
})

const isFormValid = computed(() => {
  return isPasswordValid.value && 
         passwordsMatch.value && 
         formState.value.password && 
         formState.value.confirmPassword
})

/**
 * Check if token is valid (exists and not empty)
 */
const isTokenValid = computed(() => !!token.value && token.value.length > 0)

/**
 * Handle password reset
 */
const handleResetPassword = async (event: Event) => {
  // Prevent form from reloading page
  event.preventDefault()
  
  error.value = null
  success.value = false
  loading.value = true

  console.log('[Reset-Password] Submitting password reset')

  if (!token.value) {
    error.value = 'Invalid or expired reset token. Please request a new password reset.'
    loading.value = false
    return
  }

  try {
    // Call Better-Auth's reset password endpoint
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token.value,
        newPassword: formState.value.password,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      if (data.success) {
        success.value = true
        console.log('[Reset-Password] ✅ Password reset successfully')

        // Redirect to login after successful reset
        setTimeout(() => {
          navigateTo('/auth/login')
        }, 2000)
      } else {
        throw new Error(data.message || 'Failed to reset password')
      }
    } else {
      throw new Error(data.message || 'Failed to reset password')
    }
  } catch (err: any) {
    console.error('[Reset-Password] ❌ Error:', err)
    error.value = err.message || 'An error occurred. Please try again.'
    // Show error for 5 seconds then clear it
    setTimeout(() => {
      error.value = null
    }, 5000)
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
        <div class="flex justify-center mb-5">
          <div class="relative">
            <div class="w-20 h-20 rounded-full border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <div class="w-14 h-14 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-md shadow-gray-200/50 dark:shadow-gray-900/50">
                <Icon name="heroicons:arrow-path-20-solid" class="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        <!-- Header -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Reset Your Password
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Enter your new password below
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

        <!-- Success Alert - More prominent -->
        <div v-if="success" class="mb-6">
          <UAlert
            description="Password reset successfully! Redirecting to login..."
            color="success"
            variant="subtle"
            icon="heroicons:check-circle-20-solid"
          />
          <div class="mt-4 text-center">
            <div class="inline-flex items-center justify-center">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-t-2 border-green-600 dark:border-green-400"></div>
              <span class="ml-3 text-sm text-gray-600 dark:text-gray-400">Redirecting...</span>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form @submit="handleResetPassword">
            <!-- Token Validation Alert -->
            <UAlert
              v-if="!isTokenValid && token"
              description="Invalid or expired reset link. Please request a new password reset."
              color="error"
              variant="subtle"
              icon="heroicons:exclamation-triangle-20-solid"
              class="mb-6"
            />

            <!-- Password Input -->
            <UPassword
              v-model="formState.password"
              label="New password"
              placeholder="Enter new password"
              :disabled="loading || success"
              :error="!!(formState.password && !isPasswordValid)"
              show-validation
              class="mb-4"
            />

          <!-- Confirm Password Input -->
            <UPassword
              v-model="formState.confirmPassword"
              label="Confirm new password"
              placeholder="Confirm new password"
              :disabled="loading || success"
              :error="!!(formState.confirmPassword && !passwordsMatch)"
              :error-message="confirmPasswordError"
              class="mb-4"
            />

            <!-- Submit Button -->
            <UButton
              type="submit"
              color="primary"
              variant="solid"
              size="lg"
              block
              :loading="loading"
              :disabled="loading || success || !isFormValid || !isTokenValid"
              class="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-semibold shadow-md shadow-gray-200/50 dark:shadow-gray-900/50 transition-all duration-200 cursor-pointer mb-4"
            >
            <span v-if="!loading" class="flex items-center justify-center gap-2">
              Reset Password
              <Icon name="heroicons:check-20-solid" class="w-4 h-4" />
            </span>
            <span v-else>Resetting...</span>
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
