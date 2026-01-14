<script setup lang="ts">
import { useAuthClient } from '~/lib/auth-client'
import { navigateTo } from '#app'
import { loginSchema } from '~/schemas/auth'
import { useEmailRateLimit } from '~/composables/useEmailRateLimit'

// Auth configuration
const { config: authPageConfig, getDecorativePanel, getGradientStyle } = useAuthConfig()
const panelConfig = getDecorativePanel('login')

// Rate limiting for email verification
const { checkRateLimit, recordRequest } = useEmailRateLimit()

// Computed style for gradient background
const gradientStyle = computed(() => {
  const lightStyle = getGradientStyle('login', 'light')
  const darkStyle = getGradientStyle('login', 'dark')

  // Use dark mode style when in dark mode, light mode style otherwise
  return {
    ...lightStyle,
    '--gradient-bg': lightStyle.background,
    '--gradient-bg-dark': darkStyle.background,
  }
})

// Redirect configuration - change as needed
const DEFAULT_REDIRECT = '/'

// Form state
const formState = ref({
  email: '',
  password: '',
})
const requiresTwoFactor = ref(false)
const twoFactorCode = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)
const show = ref(false)
const resendLoading = ref(false)

// Auth client
const authClient = useAuthClient()

// Get redirect from query params or use default
const route = useRoute()
const redirectTo = computed(() => {
  const redirect = route.query.redirect as string | undefined
  return redirect || DEFAULT_REDIRECT
})

// Check if user was redirected due to expired session
const isSessionExpired = computed(() => {
  return route.query.expired === 'true'
})

// Validate form in real-time
const isEmailValid = computed(() => {
  if (!formState.value.email) return true // Allow empty initially
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(formState.value.email)
})

const isPasswordValid = computed(() => {
  if (!formState.value.password) return true // Allow empty initially
  return formState.value.password.length >= 8
})

const isFormValid = computed(() => {
  return isEmailValid.value &&
    isPasswordValid.value &&
    formState.value.email &&
    formState.value.password
})

/**
 * Handle login with email and password
 */
const handleLogin = async (event: any) => {
  // Clear previous errors
  error.value = null
  success.value = false

  loading.value = true

  try {
    const response = await authClient.signIn.email({
      email: formState.value.email,
      password: formState.value.password,
      callbackURL: redirectTo.value,
    })

    console.log('[Login] Response from signIn.email:', response)
    console.log('[Login] Response data:', response.data)
    console.log('[Login] Response error:', response.error)
    console.log('[Login] twoFactorRedirect in response:', "twoFactorRedirect" in response)
    console.log('[Login] twoFactorRedirect in response.data:', "twoFactorRedirect" in response.data)

    // Check for 2FA requirement
    if (response.data?.twoFactorRedirect) {
      console.log('[Login] 2FA required, showing 2FA form')
      requiresTwoFactor.value = true
      loading.value = false
      return
    }

    // Check if login was successful (only if no 2FA required)
    if (response && !response.error && !response.data?.twoFactorRedirect) {
      success.value = true

      // Redirect after successful login
      setTimeout(() => {
        navigateTo(redirectTo.value)
      }, 500)
    } else {
      // Check if error is due to email not being verified
      const errorMessage = response?.error?.message || ''

      if (errorMessage.toLowerCase().includes('email') &&
        (errorMessage.toLowerCase().includes('verify') ||
          errorMessage.toLowerCase().includes('verification'))) {
        // Email verification required - redirect to verify-email-pending page
        console.log('[Login] Email verification required, redirecting...')
        navigateTo(`/auth/verify-email-pending?email=${encodeURIComponent(formState.value.email)}`)
        return
      }

      // Other error - show error message
      throw new Error(errorMessage || 'Invalid email or password')
    }
  } catch (err: any) {
    console.error('[Login] Login error:', err)

    // Handle email not verified error
    if (err.message?.toLowerCase().includes('not verified') ||
      err.message?.toLowerCase().includes('email verification') ||
      err.message?.toLowerCase().includes('verify your email')) {
      console.log('[Login] Email not verified detected. Sending verification email and redirecting...')

      // Store email for verify-email page
      const email = formState.value.email

      // Show error message to user
      error.value = 'Email not verified. Sending verification email...'

      try {
        // Check rate limit before sending
        resendLoading.value = true
        const rateLimit = checkRateLimit(email)

        if (!rateLimit.allowed) {
          error.value = `Too many requests. Please try again later.`
          resendLoading.value = false
          return
        }

        // Send verification email using Better-Auth API
        const result = await authClient.sendVerificationEmail({
          email,
          callbackURL: '/auth/login',
        })

        if (result.error) {
          console.error('[Login] Failed to send verification email:', result.error.message)
          // Still redirect even if email sending fails
          error.value = 'Email not verified. Redirecting...'
        } else {
          console.log('[Login] Verification email sent successfully to:', email)
          recordRequest(email)
          error.value = 'Verification email sent! Redirecting...'
        }
      } catch (resendError) {
        console.error('[Login] Error sending verification email:', resendError)
        // Continue with redirect even if email sending fails
        error.value = 'Email not verified. Redirecting...'
      } finally {
        resendLoading.value = false
      }

      // Redirect to check-email page with email parameter
      setTimeout(() => {
        navigateTo(`/auth/check-email?email=${encodeURIComponent(email)}`)
      }, 1000)

      return
    }

    // Handle different types of errors
    if (err.message?.includes('email') || err.message?.includes('password')) {
      error.value = 'Invalid email or password'
    } else if (err.message?.includes('network') || err.code === 'NETWORK_ERROR') {
      error.value = 'Network error. Please check your connection.'
    } else {
      error.value = err.message || 'An error occurred. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

/**
 * Handle 2FA Verification
 */
const handleTwoFactorVerify = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await authClient.twoFactor.verifyTotp({
      code: twoFactorCode.value,
      trustDevice: false
    })

    if (response.data) {
      success.value = true
      setTimeout(() => navigateTo(redirectTo.value), 500)
    } else {
      throw new Error(response.error?.message || 'Invalid 2FA Code')
    }
  } catch (err: any) {
    error.value = err.message || 'Verification failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-screen flex flex-col lg:flex-row overflow-hidden">
    <!-- Left Side - Form -->
    <div
      class="w-full lg:w-1/2 h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div class="w-full max-w-md h-full flex flex-col justify-between">
        <!-- Logo/Brand -->
        <div class="mb-6">
          <NuxtLink to="/">
            <img v-if="authPageConfig.logo.imageUrl" :src="authPageConfig.logo.imageUrl"
              :alt="authPageConfig.logo.imageAlt || 'Logo'" class="h-10 w-auto" />
            <h2 v-else :class="[
              'font-bold text-gray-900 dark:text-white tracking-tight',
              `text-${authPageConfig.logo.size}`
            ]">
              {{ authPageConfig.logo.text }}
            </h2>
          </NuxtLink>
        </div>

        <div>
          <!-- Avatar Circle with Double Border -->
          <div class="flex justify-start mb-5">
            <div class="relative">
              <!-- Outer circle border -->
              <div
                class="w-20 h-20 rounded-full border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <!-- Inner circle with icon -->
                <div
                  class="w-14 h-14 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-md shadow-gray-200/50 dark:shadow-gray-900/50">
                  <Icon name="heroicons:user-20-solid" class="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </div>
          </div>

          <!-- Header -->
          <div class="mb-4">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {{ authPageConfig.formSubtitle.login }}
            </p>
          </div>

          <!-- Session Expired Warning -->
          <UAlert v-if="isSessionExpired" title="Session Expired"
            description="Your session has expired. Please sign in again to continue." color="warning" variant="subtle"
            icon="heroicons:exclamation-triangle-20-solid" class="mb-6" />

          <!-- 2FA Form -->
          <div v-if="requiresTwoFactor" class="space-y-4">
            <div class="text-center mb-6">
              <div
                class="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                <Icon name="heroicons:shield-check-20-solid" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div class="mb-4">
              <UInput v-model="twoFactorCode" type="text" placeholder="000 000" size="lg" autofocus
                class="text-center font-mono text-lg tracking-widest" :ui="{ base: 'text-center' }"
                @keyup.enter="handleTwoFactorVerify" />
            </div>

            <UButton color="primary" variant="solid" size="lg" block :loading="loading" @click="handleTwoFactorVerify"
              :disabled="loading || twoFactorCode.length < 6">
              Verify
            </UButton>

            <div class="text-center mt-4">
              <UButton variant="link" color="neutral" @click="requiresTwoFactor = false">
                Back to Login
              </UButton>
            </div>
          </div>

          <!-- Login Form -->
          <UForm v-else :schema="loginSchema" :state="formState" @submit="handleLogin">
            <!-- Error Alert -->
            <UAlert v-if="error" :description="error" color="error" variant="subtle"
              icon="heroicons:information-circle-20-solid" class="mb-6" />

            <!-- Success Alert -->
            <UAlert v-if="success" description="Login successful! Redirecting..." color="success" variant="subtle"
              icon="heroicons:check-circle-20-solid" class="mb-6" />

            <!-- Email Input -->
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email address
              </label>
              <UInput v-model="formState.email" type="email" placeholder="Enter email address" size="lg"
                :disabled="loading" autofocus :color="formState.email && !isEmailValid ? 'error' : undefined"
                class="w-full">
                <template #leading>
                  <Icon name="heroicons:envelope-20-solid" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </template>
              </UInput>
              <p v-if="formState.email && !isEmailValid" class="text-red-500 text-xs mt-1.5">
                Please enter a valid email address
              </p>
            </div>

            <!-- Password Input -->
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <UInput v-model="formState.password" :type="show ? 'text' : 'password'" placeholder="Enter Password"
                size="lg" :disabled="loading" :color="formState.password && !isPasswordValid ? 'error' : undefined"
                class="w-full" :ui="{ trailing: 'pe-1' }">
                <template #leading>
                  <Icon name="heroicons:lock-closed-20-solid" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </template>
                <template #trailing>
                  <UButton color="neutral" variant="link" size="sm" :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :aria-label="show ? 'Hide password' : 'Show password'" :aria-pressed="show"
                    aria-controls="formState.password" @click="show = !show" />
                </template>
              </UInput>
              <p v-if="formState.password && !isPasswordValid" class="text-red-500 text-xs mt-1.5">
                Password must be at least 8 characters
              </p>
            </div>

            <!-- Forgot Password Link -->
            <div class="mb-3 text-right">
              <ULink to="/auth/forgot-password"
                class="text-sm text-gray-900 dark:text-white font-medium hover:underline">
                Forgot Password?
              </ULink>
            </div>

            <!-- Submit Button -->
            <UButton type="submit" color="primary" variant="solid" size="lg" block :loading="loading"
              :disabled="loading || !isFormValid"
              class="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-semibold shadow-md shadow-gray-200/50 dark:shadow-gray-900/50 transition-all duration-200 cursor-pointer">
              <span v-if="!loading" class="flex items-center justify-center gap-2">
                Sign In
                <Icon name="heroicons:arrow-right-20-solid" class="w-4 h-4" />
              </span>
              <span v-else>Signing in...</span>
            </UButton>
          </UForm>

          <!-- Register Link -->
          <div class="text-center mt-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              Don't have an account yet?
            </span>
            <ULink to="/auth/register" class="text-sm font-semibold text-gray-900 dark:text-white hover:underline ml-1">
              Create an account
            </ULink>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-4">
          <p class="text-xs text-gray-400 dark:text-gray-500">
            Your data is protected with industry-grade encryption
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            © {{ new Date().getFullYear() }} {{ authPageConfig.logo.text }}. All rights reserved.
          </p>
        </div>
      </div>
    </div>

    <!-- Right Side - Decorative Panel (Hidden on mobile) -->
    <div :class="[
      'hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden'
    ]" :style="[
      gradientStyle,
      panelConfig.backgroundImage ? `background-image: url('${panelConfig.backgroundImage}'), var(--gradient-bg); background-size: cover; background-position: center;` : ''
    ]">
      <!-- Overlay for better text readability when using background image -->
      <div v-if="panelConfig.backgroundImage" class="absolute inset-0 bg-black/40"></div>

      <div class="text-center text-white relative z-10">
        <h2 class="text-4xl font-bold mb-3">{{ panelConfig.title }}</h2>
        <p class="text-lg opacity-90">{{ panelConfig.subtitle }}</p>
      </div>
    </div>
  </div>
</template>
