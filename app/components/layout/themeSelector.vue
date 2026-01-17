<script setup lang="ts">
const { t } = useI18n()
const colorMode = useColorMode()
const config = useRuntimeConfig().public.themeMode as 'light' | 'dark' | 'toggle'

const isDark = computed({
  get () {
    return colorMode.value === 'dark'
  },
  set (_isDark: boolean) {
    colorMode.preference = _isDark ? 'dark' : 'light'
  }
})
</script>

<template>
  <ClientOnly v-if="config === 'toggle'">
    <UButton
      :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
      color="neutral"
      variant="ghost"
      :aria-label="t('common.changeTheme')"
      @click="isDark = !isDark"
    />
    <template #fallback>
      <div class="w-8 h-8" />
    </template>
  </ClientOnly>
</template>
