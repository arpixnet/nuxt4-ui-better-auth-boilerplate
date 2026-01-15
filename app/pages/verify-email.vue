<script setup lang="ts">
import { onMounted } from 'vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// Get token from query parameters
const token = computed(() => route.query.token as string)

// Verification state
const loading = ref(true)
const error = ref<string | null>(null)
const success = ref(false)

  /**
   * Process email verification
   */
  const processVerification = async () => {
    if (!token.value) {
      error.value = t('verifyEmail.error.invalidToken')
      loading.value = false
      return
    }

  try {
    console.log('[Verify-Email] Processing token:', token.value)
    
    // Call Better-Auth verify endpoint
    // The endpoint will validate token and update emailVerified status
    const response = await fetch('/verify-email', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('[Verify-Email] Response status:', response.status)

    if (response.ok) {
      success.value = true
      console.log('[Verify-Email] Verification successful')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } else {
      const errorText = await response.text()
      console.error('[Verify-Email] Verification failed:', errorText)
      
      // Better-Auth might have redirected already, so check if we got HTML
      if (response.headers.get('content-type')?.includes('text/html')) {
        // Better-Auth handled the redirect
        success.value = true
        setTimeout(() => {
          router.push('/auth/login')
        }, 1000)
      } else {
        error.value = t('verifyEmail.error.invalidToken')
      }
    }
  } catch (err: any) {
    console.error('[Verify-Email] Error:', err)
    error.value = err.message || t('verifyEmail.error.invalidToken')
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

/**
 * Go to check email page to resend verification
 */
const goToCheckEmail = () => {
  router.push('/auth/check-email')
}

onMounted(() => {
  processVerification()
})
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Brand with Language Selector -->
      <div class="mb-6 flex items-center justify-between">
        <NuxtLink to="/">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {{ t('common.appName') }}
          </h2>
        </NuxtLink>
        <LanguageSelector />
      </div>

      <!-- Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 animate-spin"></div>
          </div>
          <p class="text-gray-600 dark:text-gray-400">
            {{ t('verifyEmail.loading') }}
          </p>
        </div>

        <!-- Success State -->
        <div v-else-if="success" class="text-center py-8">
          <div class="flex justify-center mb-4">
            <div class="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Icon name="heroicons:check-circle-20-solid" class="w-12 h-12 text-green-500 dark:text-green-400" />
            </div>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {{ t('verifyEmail.success.title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ t('verifyEmail.success.message') }}
          </p>
          <UButton
            color="primary"
            variant="solid"
            size="lg"
            block
            @click="goBackToLogin"
            class="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-semibold"
          >
            {{ t('verifyEmail.success.goToLogin') }}
          </UButton>
        </div>

        <!-- Error State -->
        <div v-else class="text-center py-8">
          <div class="flex justify-center mb-4">
            <div class="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Icon name="heroicons:x-circle-20-solid" class="w-12 h-12 text-red-500 dark:text-red-400" />
            </div>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {{ t('verifyEmail.error.title') }}
          </h1>
          <UAlert
            v-if="error"
            :description="error"
            color="error"
            variant="subtle"
            icon="heroicons:information-circle-20-solid"
            class="mb-6"
          />
          <div class="space-y-3">
            <UButton
              color="primary"
              variant="solid"
              size="lg"
              block
              @click="goToCheckEmail"
              class="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-semibold"
            >
              {{ t('verifyEmail.error.resend') }}
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              size="lg"
              block
              @click="goBackToLogin"
              class="w-full"
            >
              {{ t('verifyEmail.error.backToLogin') }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-4 text-center">
        <p class="text-xs text-gray-400 dark:text-gray-500">
          © {{ new Date().getFullYear() }} {{ t('common.appName') }}. {{ t('common.footer.copyright') }}
        </p>
      </div>
    </div>
  </div>
</template>
