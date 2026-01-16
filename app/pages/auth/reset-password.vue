<script setup lang="ts">
definePageMeta({
  layout: 'blank'
})

import { navigateTo, useRoute } from '#app'
import { useI18n } from 'vue-i18n'

// i18n
const { t } = useI18n()

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
    return t('auth.resetPassword.passwordsDoNotMatch')
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
    error.value = t('auth.resetPassword.errorInvalidToken')
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
        throw new Error(data.message || t('auth.resetPassword.errorGeneric'))
      }
    } else {
      throw new Error(data.message || t('auth.resetPassword.errorGeneric'))
    }
  } catch (err: any) {
    console.error('[Reset-Password] ❌ Error:', err)
    error.value = err.message || t('auth.resetPassword.errorGeneric')
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
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {{ t('common.appName') }}
          </h2>
        </NuxtLink>
      </div>

      <!-- Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8">
        <!-- Avatar Circle -->
        <AuthAvatar icon="heroicons:arrow-path-16-solid" align="center" class="mb-5" />

        <!-- Header -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {{ t('auth.resetPassword.title') }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('auth.resetPassword.subtitle') }}
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
            :description="t('auth.resetPassword.success')"
            color="success"
            variant="subtle"
            icon="heroicons:check-circle-20-solid"
          />
          <div class="mt-4 text-center">
            <div class="inline-flex items-center justify-center">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-t-2 border-green-600 dark:border-green-400"></div>
              <span class="ml-3 text-sm text-gray-600 dark:text-gray-400">{{ t('auth.resetPassword.resetting') }}</span>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form @submit="handleResetPassword">
            <!-- Token Validation Alert -->
            <UAlert
              v-if="!isTokenValid && token"
              :description="t('auth.resetPassword.errorInvalidToken')"
              color="error"
              variant="subtle"
              icon="heroicons:exclamation-triangle-20-solid"
              class="mb-6"
            />

            <!-- Password Input -->
            <UPassword
              v-model="formState.password"
              :label="t('auth.resetPassword.newPassword')"
              :placeholder="t('auth.resetPassword.newPasswordPlaceholder')"
              :disabled="loading || success"
              :error="!!(formState.password && !isPasswordValid)"
              show-validation
              class="mb-4"
            />

          <!-- Confirm Password Input -->
            <UPassword
              v-model="formState.confirmPassword"
              :label="t('auth.resetPassword.confirmPassword')"
              :placeholder="t('auth.resetPassword.confirmPasswordPlaceholder')"
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
              {{ t('auth.resetPassword.resetPassword') }}
              <Icon name="heroicons:check-20-solid" class="w-4 h-4" />
            </span>
            <span v-else>{{ t('auth.resetPassword.resetting') }}</span>
          </UButton>

          <!-- Back to Login -->
          <div class="text-center mt-4">
            <UButton
              to="/auth/login"
              variant="link"
              color="neutral"
            >
              {{ t('auth.resetPassword.backToLogin') }}
            </UButton>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="mt-4 text-center">
        <p class="text-xs text-gray-400 dark:text-gray-500">
          {{ t('auth.resetPassword.footer', { appName: t('common.appName') }) }}
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          © {{ new Date().getFullYear() }} {{ t('common.appName') }}. {{ t('common.footer.copyright') }}
        </p>
      </div>
    </div>
  </div>
</template>
