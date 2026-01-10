<script setup lang="ts">
import { useAuthClient } from '~/lib/auth-client'
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
const showPassword = ref(false)

// Auth client
const authClient = useAuthClient()

// Validate form in real-time
const isPasswordValid = computed(() => {
  if (!formState.value.password) return true
  return formState.value.password.length >= 8
})

const passwordsMatch = computed(() => {
  if (!formState.value.password || !formState.value.confirmPassword) return true
  return formState.value.password === formState.value.confirmPassword
})

const isFormValid = computed(() => {
  return isPasswordValid.value && 
         passwordsMatch.value && 
         formState.value.password && 
         formState.value.confirmPassword
})

/**
 * Validate token (simple validation for demo)
 * In production, Better-Auth handles this automatically
 */
const isTokenValid = computed(() => {
  if (!token.value) return false
  try {
    // Decode the base64 token to check if it's valid
    const decoded = atob(token.value)
    const parts = decoded.split(':')
    return parts.length === 2 && parts[1] // email:timestamp format
  } catch {
    return false
  }
})

/**
 * Handle password reset
 */
const handleResetPassword = async (event: any) => {
  error.value = null
  success.value = false
  loading.value = true
  
  if (!isTokenValid.value) {
    error.value = 'Invalid or expired reset token. Please request a new password reset.'
    loading.value = false
    return
  }
  
  try {
    // Decode token to get email
    const decoded = atob(token.value)
    const [email] = decoded.split(':')
    
    // In production, this should call Better-Auth's resetPassword method
    // For now, we'll simulate the reset
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token.value,
        newPassword: formState.value.password,
      }),
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        success.value = true
        
        // Redirect to login after successful reset
        setTimeout(() => {
          navigateTo('/auth/login')
        }, 2000)
      } else {
        throw new Error(data.error || 'Failed to reset password')
      }
    } else {
      throw new Error('Failed to reset password')
    }
  } catch (err: any) {
    console.error('Reset password error:', err)
    error.value = err.message || 'An error occurred. Please try again.'
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

        <!-- Success Alert -->
        <UAlert
          v-if="success"
          description="Password reset successfully! Redirecting to login..."
          color="success"
          variant="subtle"
          icon="heroicons:check-circle-20-solid"
          class="mb-6"
        />

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
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                New password
              </label>
            <UInput
              v-model="formState.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter new password"
              size="lg"
              :disabled="loading || success"
              :color="formState.password && !isPasswordValid ? 'error' : undefined"
              class="w-full"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #leading>
                <Icon name="heroicons:lock-closed-20-solid" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </template>
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  :aria-pressed="showPassword"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
            <p v-if="formState.password && !isPasswordValid" class="text-red-500 text-xs mt-1.5">
              Password must be at least 8 characters
            </p>
          </div>

          <!-- Confirm Password Input -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirm new password
            </label>
            <UInput
              v-model="formState.confirmPassword"
              type="password"
              placeholder="Confirm new password"
              size="lg"
              :disabled="loading || success"
              :color="formState.confirmPassword && !passwordsMatch ? 'error' : undefined"
              class="w-full"
            >
              <template #leading>
                <Icon name="heroicons:lock-closed-20-solid" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </template>
            </UInput>
            <p v-if="formState.confirmPassword && !passwordsMatch" class="text-red-500 text-xs mt-1.5">
              Passwords do not match
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
          <div class="text-center">
            <ULink
              to="/auth/login"
              class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Back to sign in
            </ULink>
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