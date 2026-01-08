<script setup lang="ts">
import { useAuthClient } from '~/lib/auth-client'
import { navigateTo } from '#app'
import { useRuntimeConfig } from '#app'
import { registerSchema } from '~/schemas/auth'

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
      
      // Redirect after successful registration
      setTimeout(() => {
        navigateTo(DEFAULT_REDIRECT)
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
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Create Account
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Join us to get started
          </p>
        </div>
      </template>

      <template #default>
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
            class="mb-4"
          />

          <!-- Success Alert -->
          <UAlert
            v-if="success"
            description="Registration successful! Redirecting..."
            color="success"
            variant="subtle"
            icon="heroicons:check-circle-20-solid"
            class="mb-4"
          />

          <!-- Email Input -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <UInput
              v-model="formState.email"
              type="email"
              placeholder="you@example.com"
              icon="heroicons:envelope-20-solid"
              size="lg"
              :disabled="loading"
              :color="formState.email && !isEmailValid ? 'error' : undefined"
            />
            <p v-if="formState.email && !isEmailValid" class="text-red-500 text-sm mt-1">
              Please enter a valid email address
            </p>
          </div>

          <!-- Password Input -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <UInput
              v-model="formState.password"
              type="password"
              placeholder="••••••"
              icon="heroicons:lock-closed-20-solid"
              size="lg"
              :disabled="loading"
              :color="formState.password && !isPasswordValid ? 'error' : undefined"
            />
            <p v-if="formState.password && !isPasswordValid" class="text-red-500 text-sm mt-1">
              Password must be at least 8 characters
            </p>
            <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
          >
            <span v-if="!loading">Create Account</span>
            <span v-else>Creating account...</span>
          </UButton>
        </UForm>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">
              Already have an account?
            </span>
          </div>
        </div>

        <!-- Login Link -->
        <div class="text-center">
          <ULink
            to="/auth/login"
            class="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Sign in
          </ULink>
        </div>
      </template>
    </UCard>
  </div>
</template>
