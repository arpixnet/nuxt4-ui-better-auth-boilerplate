<script setup lang="ts">
import { useAuthClient } from '~/lib/auth-client'
import { navigateTo } from '#app'
import { useRuntimeConfig } from '#app'
import { registerSchema } from '~/schemas/auth'

// Auth configuration
const { config: authPageConfig, getDecorativePanel, getGradientStyle } = useAuthConfig()
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
const show = ref(false)

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
      throw new Error(response?.error?.message || 'Registration failed')
    }
  } catch (err: any) {
    console.error('Registration error:', err)
    
    // Handle different types of errors
    if (err.message?.includes('email') || err.message?.includes('already')) {
      error.value = 'Email already in use'
    } else if (err.message?.includes('password')) {
      error.value = 'Password requirements not met'
    } else if (err.message?.includes('network') || err.code === 'NETWORK_ERROR') {
      error.value = 'Network error. Please check your connection.'
    } else {
      error.value = err.message || 'An error occurred. Please try again.'
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
        <!-- Logo/Brand -->
        <div class="mb-6">
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
              {{ authPageConfig.logo.text }}
            </h2>
          </NuxtLink>
        </div>

        <div>
          <!-- Avatar Circle with Double Border -->
          <div class="flex justify-start mb-5">
            <div class="relative">
              <!-- Outer circle border -->
              <div class="w-20 h-20 rounded-full border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <!-- Inner circle with icon -->
                <div class="w-14 h-14 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-md shadow-gray-200/50 dark:shadow-gray-900/50">
                  <Icon name="heroicons:user-plus-20-solid" class="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </div>
          </div>

          <!-- Header -->
          <div class="mb-4">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              Create Account
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {{ authPageConfig.formSubtitle.register }}
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
                Email address
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
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <UInput
                v-model="formState.password"
                :type="show ? 'text' : 'password'"
                placeholder="Enter Password"
                size="lg"
                :disabled="loading"
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
                    :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :aria-label="show ? 'Hide password' : 'Show password'"
                    :aria-pressed="show"
                    aria-controls="formState.password"
                    @click="show = !show"
                  />
                </template>
              </UInput>
              <p v-if="formState.password && !isPasswordValid" class="text-red-500 text-xs mt-1.5">
                Password must be at least 8 characters
              </p>
              <p v-else class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Must be at least 8 characters
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
              :disabled="loading || !isFormValid"
              class="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-semibold shadow-md shadow-gray-200/50 dark:shadow-gray-900/50 transition-all duration-200 cursor-pointer"
            >
              <span v-if="!loading" class="flex items-center justify-center gap-2">
                Create Account
                <Icon name="heroicons:arrow-right-20-solid" class="w-4 h-4" />
              </span>
              <span v-else>Creating account...</span>
            </UButton>
          </UForm>

          <!-- Login Link -->
          <div class="text-center mt-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?
            </span>
            <ULink
              to="/auth/login"
              class="text-sm font-semibold text-gray-900 dark:text-white hover:underline ml-1"
            >
              Sign in
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
        <h2 class="text-4xl font-bold mb-3">{{ panelConfig.title }}</h2>
        <p class="text-lg opacity-90">{{ panelConfig.subtitle }}</p>
      </div>
    </div>
  </div>
</template>
