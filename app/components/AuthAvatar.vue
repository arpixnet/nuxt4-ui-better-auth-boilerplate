<script setup lang="ts">
export interface AuthAvatarProps {
  icon: string
  align?: 'left' | 'center'
  variant?: 'default' | 'success' | 'warning'
}

const props = withDefaults(defineProps<AuthAvatarProps>(), {
  align: 'left',
  variant: 'default',
})

// Variant configurations
const variantConfig = {
  default: {
    outerBorder: 'border-gray-200/60 dark:border-gray-700/60',
    outerBg: 'bg-gray-100 dark:bg-gray-900/30',
    innerBg: 'bg-white dark:bg-gray-800',
    iconColor: 'text-gray-500 dark:text-gray-400',
    shadowColor: 'shadow-gray-300/60 dark:shadow-gray-900',
  },
  success: {
    outerBorder: 'border-green-200/60 dark:border-green-700/60',
    outerBg: 'bg-green-50/50 dark:bg-green-900/50',
    innerBg: 'bg-green-100 dark:bg-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
    shadowColor: 'shadow-green-200/50 dark:shadow-green-900/50',
  },
  warning: {
    outerBorder: 'border-amber-200/60 dark:border-amber-700/60',
    outerBg: 'bg-amber-50/50 dark:bg-amber-900/50',
    innerBg: 'bg-amber-50 dark:bg-amber-900/30',
    iconColor: 'text-amber-500 dark:text-amber-400',
    shadowColor: 'shadow-amber-200/50 dark:shadow-amber-900/50',
  },
} as const

const currentVariant = computed(() => variantConfig[props.variant])
</script>

<template>
  <div class="relative" :class="align === 'center' ? 'flex justify-center' : 'flex justify-start'">
    <!-- Outer circle border -->
    <div class="w-20 h-20 rounded-full border flex items-center justify-center backdrop-blur-sm" :class="[
      currentVariant.outerBorder,
      currentVariant.outerBg,
    ]">
      <!-- Inner circle with icon -->
      <div class="w-14 h-14 rounded-full flex items-center justify-center shadow-md"
        :class="[currentVariant.innerBg, currentVariant.shadowColor]">
        <Icon :name="icon" class="w-6 h-6" :class="currentVariant.iconColor" />
      </div>
    </div>
  </div>
</template>
