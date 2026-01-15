<script setup lang="ts">
import { useAuthClient } from '~/lib/auth-client'
import { useAuthSession } from '~/composables/useAuthSession'
import { useRoute } from '#app'
import { useI18n } from 'vue-i18n'

// i18n
const { t, locale } = useI18n()

// Rate limiting for email verification
const { checkRateLimit, recordRequest } = useEmailRateLimit()

// Route and session data
const route = useRoute()
const authSession = useAuthSession()

// Email from URL query parameter takes priority over session email
const userEmail = computed(() => {
  const emailFromUrl = route.query.email as string
  if (emailFromUrl) {
    return decodeURIComponent(emailFromUrl)
  }
  return authSession.session.value.data?.user?.email || ''
})

const userName = computed(() => authSession.session.value.data?.user?.name || userEmail.value.split('@')[0] || 'User')

// Form state
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

// Auth client
const authClient = useAuthClient()

/**
 * Resend verification email using Better-Auth API
 */
const handleResendEmail = async () => {
  error.value = null
  success.value = false
  loading.value = true

  const emailToSend = userEmail.value
  console.log('[Check-Email] Attempting to resend verification email to:', emailToSend)

  try {
    // Check rate limit before sending
    const rateLimit = checkRateLimit(emailToSend)

    if (!rateLimit.allowed) {
      error.value = t('auth.checkEmail.rateLimit', { remaining: rateLimit.remaining })
      loading.value = false
      return
    }

    console.log('[Check-Email] Rate limit check passed. Remaining:', rateLimit.remaining)

    // Send verification email using Better-Auth API
    const result = await authClient.sendVerificationEmail({
      email: emailToSend,
      callbackURL: '/auth/login',
    })

    console.log('[Check-Email] Send verification response:', result)

    if (result.error) {
      throw new Error(result.error.message || t('auth.checkEmail.errorGeneric'))
    }

    // Record successful request for rate limiting
    recordRequest(emailToSend)

    success.value = true
    console.log('[Check-Email] Verification email sent successfully')
  } catch (err: any) {
    console.error('[Check-Email] Resend verification error:', err)
    error.value = err.message || t('auth.checkEmail.errorGeneric')
  } finally {
    loading.value = false
    // Reset success message after 5 seconds
    if (success.value) {
      setTimeout(() => {
        success.value = false
      }, 5000)
    }
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
        <AuthAvatar icon="heroicons:envelope-16-solid" align="center" class="mb-5" />

        <!-- Header -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {{ t('auth.checkEmail.title') }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {{ t('auth.checkEmail.subtitle') }}
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
          :description="t('auth.checkEmail.success')"
          color="success"
          variant="subtle"
          icon="heroicons:check-circle-20-solid"
          class="mb-6"
        />

        <!-- Info Box -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div class="flex items-start gap-3">
            <Icon name="heroicons:information-circle-20-solid" class="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {{ t('auth.checkEmail.whatsNext') }}
              </h3>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li class="flex items-start gap-2">
                  <span class="text-blue-500 font-bold">1.</span>
                  <span>{{ t('auth.checkEmail.step1') }}</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-blue-500 font-bold">2.</span>
                  <span>{{ t('auth.checkEmail.step2') }}</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-blue-500 font-bold">3.</span>
                  <span>{{ t('auth.checkEmail.step3') }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Resend Button -->
        <UButton
          color="primary"
          variant="solid"
          size="lg"
          block
          :loading="loading"
          :disabled="loading"
          @click="handleResendEmail"
          class="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-semibold shadow-md shadow-gray-200/50 dark:shadow-gray-900/50 transition-all duration-200 cursor-pointer mb-4"
        >
          <span v-if="!loading" class="flex items-center justify-center gap-2">
            {{ t('auth.checkEmail.resendVerificationEmail') }}
            <Icon name="heroicons:arrow-path-20-solid" class="w-4 h-4" />
          </span>
          <span v-else>{{ t('auth.checkEmail.sending') }}</span>
        </UButton>

        <!-- Links -->
        <div class="text-center space-y-2">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('auth.checkEmail.alreadyVerified') }}
          </p>
          <ULink
            to="/auth/login"
            class="text-sm font-semibold text-gray-900 dark:text-white hover:underline"
          >
            {{ t('auth.checkEmail.signIn') }}
          </ULink>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-4 text-center">
        <p class="text-xs text-gray-400 dark:text-gray-500">
          {{ t('auth.checkEmail.footer', { appName: t('common.appName') }) }}
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          © {{ new Date().getFullYear() }} {{ t('common.appName') }}. {{ t('common.footer.copyright') }}
        </p>
      </div>
    </div>
  </div>
</template>
