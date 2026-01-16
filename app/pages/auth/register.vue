<script setup lang="ts">
definePageMeta({
  layout: 'blank',
  middleware: ['register-allowed']
})

import { useAuthClient } from '~/lib/auth-client'
import { navigateTo } from '#app'
import { useRuntimeConfig } from '#app'
import { registerSchema } from '~/schemas/auth'
import { useI18n } from '#imports'

// Auth configuration
const { config: authPageConfig, getDecorativePanel, getGradientStyle } = useAuthConfig()
const { t } = useI18n()
const panelConfig = getDecorativePanel('register')

// Computed style for gradient background
const gradientStyle = computed(() => {
  const lightStyle = getGradientStyle('register', 'light')
  const darkStyle = getGradientStyle('register', 'dark')
  
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
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

// Auth client
const authClient = useAuthClient()
const config = useRuntimeConfig()

// Check if email verification is required
const requiresEmailVerification = computed(() => {
  return config.public.betterAuth.emailVerification === true
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
 * Handle registration with email and password
 */
const handleRegister = async (event: any) => {
  // Clear previous errors
  error.value = null
  success.value = false
  
  loading.value = true
  
  try {
    const emailParts = formState.value.email.split('@')
    const defaultName = emailParts[0] || 'User'
    
    const response = await authClient.signUp.email({
      email: formState.value.email,
      password: formState.value.password,
      name: defaultName,
      callbackURL: DEFAULT_REDIRECT,
    })
    
    // Check if registration was successful
    if (response && !response.error) {
      success.value = true
      
      // Note: Better-Auth automatically sends welcome email via sendVerificationEmail hook
      // configured in server/lib/auth.ts with sendOnSignUp: true
      // No manual email sending needed here
      
      // Redirect after successful registration
      // If email verification is required, redirect to check-email page with email
      // Otherwise, redirect to default page
      setTimeout(() => {
        const redirectUrl = requiresEmailVerification.value 
          ? `/auth/check-email?email=${encodeURIComponent(formState.value.email)}`
          : DEFAULT_REDIRECT
        navigateTo(redirectUrl)
      }, 500)
    } else {
      // Better-Auth returned an error
      throw new Error(response?.error?.message || t('auth.register.errorGeneric'))
    }
  } catch (err: any) {
    console.error('Registration error:', err)
    
    // Handle different types of errors
    if (err.message?.includes('email') || err.message?.includes('already')) {
      error.value = t('auth.register.errorEmailExists')
    } else if (err.message?.includes('password')) {
      error.value = t('auth.register.errorPassword')
    } else if (err.message?.includes('network') || err.code === 'NETWORK_ERROR') {
      error.value = t('auth.register.errorNetwork')
    } else {
      error.value = err.message || t('auth.register.errorGeneric')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-screen flex flex-col lg:flex-row overflow-hidden">
    <!-- Left Side - Form -->
    <div class="w-full lg:w-1/2 h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div class="w-full max-w-md h-full flex flex-col justify-between">
        <!-- Logo/Brand with Language Selector -->
        <div class="mb-6 flex items-center justify-between">
          <NuxtLink to="/">
            <img
              v-if="authPageConfig.logo.imageUrl"
              :src="authPageConfig.logo.imageUrl"
              :alt="authPageConfig.logo.imageAlt || 'Logo'"
              class="h-10 w-auto"
            />
            <h2
              v-else
              :class="[
                'font-bold text-gray-900 dark:text-white tracking-tight',
                `text-${authPageConfig.logo.size}`
              ]"
            >
              {{ t('common.appName') }}
            </h2>
          </NuxtLink>
          <LanguageSelector />
        </div>

        <div>
          <!-- Avatar Circle -->
          <AuthAvatar icon="heroicons:user-plus-solid" class="mb-5" />

          <!-- Header -->
          <div class="mb-4">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              {{ t('auth.register.title') }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {{ t('auth.register.subtitle') }}
            </p>
          </div>

          <!-- Form -->
          <UForm
            :schema="registerSchema"
            :state="formState"
            @submit="handleRegister"
          >
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
              :description="requiresEmailVerification 
                ? 'Registration successful! Please check your email to verify your account.'
                : 'Registration successful! Redirecting...'"
              color="success"
              variant="subtle"
              icon="heroicons:check-circle-20-solid"
              class="mb-6"
            />

            <!-- Email Input -->
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {{ t('auth.register.email') }}
              </label>
              <UInput
                v-model="formState.email"
                type="email"
                placeholder="Enter email address"
                size="lg"
                :disabled="loading"
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

            <!-- Password Input -->
            <UPassword
              v-model="formState.password"
              :label="t('auth.register.password')"
              placeholder="Enter Password"
              :disabled="loading"
              :error="!!(formState.password && !isPasswordValid)"
              show-validation
              class="mb-3"
            />

            <!-- Submit Button -->
            <UButton
              type="submit"
              color="primary"
              variant="solid"
              size="lg"
              block
              :loading="loading"
              :disabled="loading || !isFormValid"
              class="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-semibold shadow-md shadow-gray-200/50 dark:shadow-gray-900/50 transition-all duration-200 cursor-pointer"
            >
              <span v-if="!loading" class="flex items-center justify-center gap-2">
                {{ t('auth.register.createAccount') }}
                <Icon name="heroicons:arrow-right-20-solid" class="w-4 h-4" />
              </span>
              <span v-else>{{ t('auth.register.creatingAccount') }}</span>
            </UButton>
          </UForm>

          <!-- Login Link -->
          <div class="text-center mt-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('auth.register.hasAccount') }}
            </span>
            <ULink
              to="/auth/login"
              class="text-sm font-semibold text-gray-900 dark:text-white hover:underline ml-1"
            >
              {{ t('auth.register.signIn') }}
            </ULink>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-4">
          <p class="text-xs text-gray-400 dark:text-gray-500">
            {{ t('common.footer.encryption') }}
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            © {{ new Date().getFullYear() }} {{ t('common.appName') }}. {{ t('common.footer.copyright') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Right Side - Decorative Panel (Hidden on mobile) -->
    <div
      :class="[
        'hidden lg:flex lg:w-1/2 items-center justify-center p-8 relative overflow-hidden'
      ]"
      :style="[
        gradientStyle,
        panelConfig.backgroundImage ? `background-image: url('${panelConfig.backgroundImage}'), var(--gradient-bg); background-size: cover; background-position: center;` : ''
      ]"
    >
      <!-- Overlay for better text readability when using background image -->
      <div v-if="panelConfig.backgroundImage" class="absolute inset-0 bg-black/40"></div>

      <div class="text-center text-white relative z-10">
        <h2 class="text-4xl font-bold mb-3">{{ t('auth.register.panelTitle') }}</h2>
        <p class="text-lg opacity-90">{{ t('auth.register.panelSubtitle') }}</p>
      </div>
    </div>
  </div>
</template>
