<script setup lang="ts">
import { useAuthClient } from '~/lib/auth-client'
import { navigateTo } from '#app'
import { useRuntimeConfig } from '#app'

// Form state
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

// Auth client
const authClient = useAuthClient()
const config = useRuntimeConfig()

// Password match validation
const passwordsMatch = computed(() => {
  if (!password.value || !confirmPassword.value) return null
  return password.value === confirmPassword.value
})

/**
 * Handle registration with email and password
 */
const handleRegister = async () => {
  // Clear previous errors
  error.value = null
  success.value = false
  
  // Basic validation
  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields'
    return
  }
  
  if (!email.value.includes('@')) {
    error.value = 'Please enter a valid email address'
    return
  }
  
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }
  
  if (passwordsMatch.value === false) {
    error.value = 'Passwords do not match'
    return
  }
  
  loading.value = true
  
  try {
    await authClient.signUp.email({
      email: email.value,
      password: password.value,
      name: name.value,
      callbackURL: config.public.betterAuth.defaultRedirect,
    })
    
    success.value = true
    
    // Redirect after successful registration
    setTimeout(() => {
      navigateTo(config.public.betterAuth.defaultRedirect)
    }, 500)
  } catch (err) {
    console.error('Registration error:', err)
    error.value = 'Registration failed. Email may already be in use.'
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
        <UForm @submit.prevent="handleRegister">
          <!-- Error Alert -->
          <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            icon="heroicons:information-circle-20-solid"
            class="mb-4"
          >
            {{ error }}
          </UAlert>

          <!-- Success Alert -->
          <UAlert
            v-if="success"
            color="success"
            variant="subtle"
            icon="heroicons:check-circle-20-solid"
            class="mb-4"
          >
            Registration successful! Redirecting...
            <p v-if="config.public.betterAuth.emailVerification" class="mt-2 text-sm">
              Please check your email to verify your account before signing in.
            </p>
          </UAlert>

          <!-- Name Input -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <UInput
              v-model="name"
              type="text"
              placeholder="John Doe"
              icon="heroicons:user-20-solid"
              size="lg"
              :disabled="loading"
              autofocus
            />
          </div>

          <!-- Email Input -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <UInput
              v-model="email"
              type="email"
              placeholder="you@example.com"
              icon="heroicons:envelope-20-solid"
              size="lg"
              :disabled="loading"
            />
          </div>

          <!-- Password Input -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <UInput
              v-model="password"
              type="password"
              placeholder="••••••••••"
              icon="heroicons:lock-closed-20-solid"
              size="lg"
              :disabled="loading"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must be at least 8 characters
            </p>
          </div>

          <!-- Confirm Password Input -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <UInput
              v-model="confirmPassword"
              type="password"
              placeholder="••••••"
              icon="heroicons:lock-closed-20-solid"
              size="lg"
              :disabled="loading"
            />
            <p
              v-if="passwordsMatch === false"
              class="mt-1 text-xs text-red-500"
            >
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
            :disabled="loading || passwordsMatch === false"
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
