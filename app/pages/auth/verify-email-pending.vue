<script setup lang="ts">
definePageMeta({
  layout: 'blank'
})

import { useRoute, useRouter } from '#app'
import { useRuntimeConfig } from '#app'
import { useAuthClient } from '~/lib/auth-client'
import { useEmailRateLimit } from '~/composables/useEmailRateLimit'
import { useI18n } from 'vue-i18n'

// i18n
const { t } = useI18n()

// Auth client and rate limiting
const authClient = useAuthClient()
const { checkRateLimit, recordRequest } = useEmailRateLimit()

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
 * Resend verification email using Better-Auth API
 */
const handleResendEmail = async () => {
  error.value = null
  success.value = false
  loading.value = true

  const emailToSend = userEmail.value
  console.log('[Verify-Email-Pending] Attempting to resend verification email to:', emailToSend)

  try {
    // Check rate limit before sending
    const rateLimit = checkRateLimit(emailToSend)

    if (!rateLimit.allowed) {
      error.value = t('auth.verifyEmailPending.rateLimit', { remaining: rateLimit.remaining })
      loading.value = false
      return
    }

    console.log('[Verify-Email-Pending] Rate limit check passed. Remaining:', rateLimit.remaining)

    // Send verification email using Better-Auth API
    const result = await authClient.sendVerificationEmail({
      email: emailToSend,
      callbackURL: '/auth/login',
    })

    console.log('[Verify-Email-Pending] Send verification response:', result)

    if (result.error) {
      throw new Error(result.error.message || t('auth.verifyEmailPending.errorGeneric'))
    }

    // Record successful request for rate limiting
    recordRequest(emailToSend)

    success.value = true
    console.log('[Verify-Email-Pending] Verification email sent successfully')
  } catch (err: any) {
    console.error('[Verify-Email-Pending] Error:', err)
    error.value = err.message || t('auth.verifyEmailPending.errorGeneric')
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
            {{ t('common.appName') }}
          </h2>
        </NuxtLink>
      </div>

      <!-- Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8">
        <!-- Avatar Circle -->
        <AuthAvatar icon="heroicons:envelope-16-solid" align="center" class="mb-5" />

        <!-- Header -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {{ t('auth.verifyEmailPending.title') }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {{ t('auth.verifyEmailPending.subtitle') }}
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
          :description="t('auth.verifyEmailPending.success')"
          color="success"
          variant="subtle"
          icon="heroicons:check-circle-20-solid"
          class="mb-6"
        />

        <!-- Instructions -->
        <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p class="text-sm text-blue-800 dark:text-blue-200 mb-2">
            {{ t('auth.verifyEmailPending.checkYourEmail') }}
          </p>
          <p class="text-sm text-blue-700 dark:text-blue-300">
            {{ t('auth.verifyEmailPending.instructions') }}
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
          <span v-if="!loading">{{ t('auth.verifyEmailPending.resendVerificationEmail') }}</span>
          <span v-else>{{ t('auth.verifyEmailPending.sending') }}</span>
        </UButton>

        <!-- Back to Login -->
        <UButton
          variant="link"
          color="neutral"
          @click="goBackToLogin"
        >
          {{ t('auth.verifyEmailPending.backToLogin') }}
        </UButton>
      </div>
    </div>
  </div>
</template>
