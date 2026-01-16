<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { locales, locale, setLocale, t } = useI18n()

interface LanguageInfo {
  code: string
  name: string
  flag: string
  shortName: string
}

const availableLocales = computed(() => {
  return locales.value.map((lang: any) => ({
    code: lang.code,
    name: lang.name,
    flag: lang.flag,
    shortName: lang.code === 'es' ? 'ES' : 'EN'
  }))
})

const currentLocale = computed(() => {
  return availableLocales.value.find((lang: any) => lang.code === locale.value)
})

const items = computed<DropdownMenuItem[]>(() => {
  return availableLocales.value.map((lang: LanguageInfo) => ({
    label: `${lang.flag} ${lang.name}`,
    value: lang.code,
    onSelect: () => {
      setLocale(lang.code as 'es' | 'en')
    }
  }))
})

// Current locale as label
const currentLabel = computed(() => {
  return currentLocale.value ? `${currentLocale.value.flag} ${currentLocale.value.shortName}` : '🇺🇸 EN'
})
</script>

<template>
  <UDropdownMenu :items="items" :ui="{ content: 'w-40' }">
    <UButton
      color="neutral"
      variant="ghost"
      size="md"
      :aria-label="t('common.changeLanguage')"
    >
      <div class="flex items-center gap-1">
        <span class="text-lg">{{ currentLocale?.flag }}</span>
        <span class="text-sm font-medium">{{ currentLocale?.shortName }}</span>
        <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
      </div>
    </UButton>
  </UDropdownMenu>
</template>
