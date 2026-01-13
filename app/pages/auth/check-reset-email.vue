<script setup lang="ts">
import { useRoute } from '#app'
import { authConfig } from '~/config/auth.config'

// Auth configuration
const authPageConfig = authConfig

// Get email from query params
const route = useRoute()
const email = computed(() => route.query.email as string || 'your email')
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
            <!-- Outer circle border -->
            <div class="w-20 h-20 rounded-full border border-green-200/60 dark:border-green-700/60 flex items-center justify-center bg-green-50/50 dark:bg-green-900/50 backdrop-blur-sm">
              <!-- Inner circle with icon -->
              <div class="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shadow-md shadow-green-200/50 dark:shadow-green-900/50">
                <Icon name="heroicons:check-circle-20-solid" class="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <!-- Header -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Check Your Email
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            We've sent a password reset link to <strong>{{ email }}</strong>
          </p>
        </div>

        <!-- Success Alert -->
        <UAlert
          description="If you don't receive the email within a few minutes, check your spam folder."
          color="info"
          variant="subtle"
          icon="heroicons:envelope-20-solid"
          class="mb-6"
        />

        <!-- Info Box -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r mb-6">
          <h3 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            What's Next?
          </h3>
          <ul class="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li class="flex items-start">
              <Icon name="heroicons:check-circle-20-solid" class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span>Click the link in the email to reset your password</span>
            </li>
            <li class="flex items-start">
              <Icon name="heroicons:clock-20-solid" class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span>The link expires in 1 hour for security</span>
            </li>
            <li class="flex items-start">
              <Icon name="heroicons:shield-check-20-solid" class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span>Keep your new password secure</span>
            </li>
          </ul>
        </div>

        <!-- Buttons -->
        <div class="space-y-3">
          <ULink
            to="/auth/login"
            class="flex items-center justify-center w-full text-center bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg shadow-md shadow-gray-200/50 dark:shadow-gray-900/50 transition-all duration-200"
          >
            <span class="flex items-center justify-center gap-2">
              Back to Sign In
              <Icon name="heroicons:arrow-right-20-solid" class="w-4 h-4" />
            </span>
          </ULink>

          <ULink
            to="/auth/forgot-password"
            class="flex items-center justify-center w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Request another reset link
          </ULink>
        </div>
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
