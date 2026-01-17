<script setup lang="ts">
import { useAuthClient } from '~/lib/auth-client'
import { useI18n } from '#imports'

// Props
interface Props {
  providers?: string[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  providers: () => [],
  loading: false
})

// Composables
const authClient = useAuthClient()
const { t } = useI18n()
const route = useRoute()

// Local loading state per provider
const providerLoading = ref<Record<string, boolean>>({})
const error = ref<string | null>(null)

// Get redirect from query params
const redirectTo = computed(() => {
  return (route.query.redirect as string) || '/'
})

/**
 * Provider configuration with icons
 * All buttons use neutral colors: light gray in light mode, dark gray in dark mode
 * Extensible: Add new providers here
 */
const providerConfig: Record<string, { icon: string }> = {
  google: { icon: 'logos:google-icon' },
  facebook: { icon: 'logos:facebook' },
  github: { icon: 'mdi:github' },
  apple: { icon: 'ic:baseline-apple' },
  twitter: { icon: 'prime:twitter' },
  x: { icon: 'simple-icons:x' },
  linkedin: { icon: 'mdi:linkedin' },
  microsoft: { icon: 'mdi:microsoft' },
  spotify: { icon: 'logos:spotify-icon' },
  discord: { icon: 'logos:discord-icon' },
  twitch: { icon: 'mdi:twitch' },
  amazon: { icon: 'mdi:amazon' },
  instagram: { icon: 'mdi:instagram' },
  tiktok: { icon: 'logos:tiktok-icon' },
  paypal: { icon: 'logos:paypal' },
  reddit: { icon: 'logos:reddit-icon' },
  snapchat: { icon: 'logos:snapchat-icon' },
  yahoo: { icon: 'mdi:yahoo' },
  dropbox: { icon: 'mdi:dropbox' }
}

/**
 * Handle social sign-in
 */
const handleSocialSignIn = async (provider: string) => {
  if (props.loading || providerLoading.value[provider]) return
  
  // Clear previous errors
  error.value = null
  providerLoading.value[provider] = true
  
  try {
    await authClient.signIn.social({
      provider,
      callbackURL: redirectTo.value
    })
  } catch (err: any) {
    console.error(`[Social Sign In] Error with ${provider}:`, err)
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1)
    error.value = t('auth.social.error', { provider: providerName })
  } finally {
    providerLoading.value[provider] = false
  }
}

/**
 * Get provider icon
 */
const getProviderIcon = (provider: string) => {
  return providerConfig[provider]?.icon || 'heroicons:user-circle'
}
</script>

<template>
  <div v-if="providers.length > 0" class="space-y-2">
    <!-- Error Alert -->
    <UAlert
      v-if="error"
      :description="error"
      color="error"
      variant="subtle"
      icon="heroicons:information-circle-20-solid"
      class="mb-4"
    />

    <!-- Separator -->
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-300 dark:border-gray-700"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
          {{ t('auth.social.orContinueWith') }}
        </span>
      </div>
    </div>

    <!-- Social Buttons Grid -->
    <!-- Social Buttons Grid -->
    <div class="flex flex-wrap justify-center gap-2 py-4">
        <button
        v-for="provider in providers"
        :key="provider"
        @click="handleSocialSignIn(provider)"
        :disabled="loading || providerLoading[provider]"
        :class="[
          'w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center',
          'bg-gray-200 hover:bg-gray-300',
          'dark:bg-gray-700 dark:hover:bg-gray-600',
          'transition-all duration-200 shadow-sm hover:shadow-md',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-gray-700',
          'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
        ]"
        :title="provider.charAt(0).toUpperCase() + provider.slice(1)"
      >
        <!-- Loading Spinner -->
        <Icon
          v-if="providerLoading[provider]"
          name="heroicons:arrow-path-20-solid"
          class="w-5 h-5 text-gray-600 dark:text-white animate-spin"
        />
        
        <!-- Provider Icon -->
        <Icon
          v-else
          :name="getProviderIcon(provider)"
          class="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-white"
        />
      </button>
    </div>
  </div>
</template>
