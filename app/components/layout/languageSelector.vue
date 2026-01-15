<script setup lang="ts">
    interface LanguageInfo {
        code: string;
        name: string;
        flag: string;
        shortName: string;
    }

    const { locales, locale, setLocale, t } = useI18n()

    // Dropdown state
    const isOpen = ref(false);
    const dropdownRef = ref<HTMLElement | null>(null);

    const availableLocales = computed(() => {
        return locales.value.filter(i => i.code !== locale.value)
    })

    const currentLocale = computed(() => {
        const currentLocale: any = locales.value.find(i => i.code === locale.value)
        return currentLocale ? currentLocale : { shortName: 'EN', flag: '🇬🇧' }
    })

    // Toggle dropdown menu
    const toggleMenu = () => {
        isOpen.value = !isOpen.value
    }

    // Close dropdown when clicking outside
    const onClickOutside = (event: MouseEvent) => {
        if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
            isOpen.value = false
        }
    }

    // Add event listener for click outside
    onMounted(() => {
        document.addEventListener('click', onClickOutside)
    })

    // Remove event listener when component is unmounted
    onBeforeUnmount(() => {
        document.removeEventListener('click', onClickOutside)
    })
</script>

<template>
    <div ref="dropdownRef" class="relative inline-block" @click.stop>
        <!-- Language selector button -->
        <button
            type="button"
            @click="toggleMenu"
            class="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            :aria-label="t('common.changeLanguage')"
            :aria-expanded="isOpen"
        >
            <div class="flex items-center gap-1">
                <span class="text-lg">{{ currentLocale.flag }}</span><span class="text-sm font-medium">{{ currentLocale.shortName }}</span>
            </div>
            <Icon
                name="mdi:chevron-down"
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'transform rotate-180': isOpen }"
            />
        </button>

        <!-- Dropdown menu -->
        <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
        >
            <div
                v-if="isOpen"
                class="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 rounded-md shadow-lg overflow-hidden z-10 border border-slate-200 dark:border-slate-700"
            >
                <!-- List of available languages -->
                <button
                    v-for="lang in availableLocales"
                    :key="lang.code"
                    @click.prevent.stop="setLocale(lang.code); isOpen = false"
                    class="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    :class="{'bg-slate-100 dark:bg-slate-800': lang.code === (locale as string)}"
                >
                    <span class="text-base">{{ lang.flag }}</span>
                    <span>{{ lang.name }}</span>
                </button>
            </div>
        </transition>
    </div>
</template>
