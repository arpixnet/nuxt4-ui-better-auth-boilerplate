<script setup lang="ts">
import { useAuthClient } from '~/lib/auth-client'

// Mark this page as public (no auth required)
definePageMeta({
    requiresAuth: false
})

// En Nuxt 4, los composables son auto-importables
const { t } = useI18n()
const { session, pending } = useAuthSession()
const authClient = useAuthClient()

// Estado para controlar si ya se inicializó la sesión
const isInitialized = ref(false)

// Estado para el JWT token
const jwtToken = ref<string | null>(null)
const jwtPending = ref(false)

// Estado para el botón de copiar
const copyButtonText = ref<string>(t('jwt.copy'))

// Estado para controlar el collapsible
const jwtExpanded = ref(false)

// Marcar como inicializado cuando termine de cargar
watchEffect(() => {
    if (!pending.value) {
        isInitialized.value = true
    }
})

// Cargar el JWT token cuando el usuario esté autenticado
watchEffect(async () => {
    if (isInitialized.value && session.value.data?.user && !jwtToken.value) {
        try {
            jwtPending.value = true
            const { data, error } = await authClient.token()
            if (data?.token) {
                jwtToken.value = data.token
            }
            if (error) {
                console.error('[JWT] Error fetching token:', error)
            }
        }
        catch (error) {
            console.error('[JWT] Failed to fetch token:', error)
        }
        finally {
            jwtPending.value = false
        }
    }
})

// Función para copiar el token al portapapeles
const copyToken = async () => {
    if (jwtToken.value) {
        try {
            await navigator.clipboard.writeText(jwtToken.value)
            copyButtonText.value = t('jwt.copied')
            setTimeout(() => {
                copyButtonText.value = t('jwt.copy')
            }, 2000)
        }
        catch (error) {
            console.error('Failed to copy token:', error)
            // Fallback para navegadores que no soporten la API
            const textArea = document.createElement('textarea')
            textArea.value = jwtToken.value
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            copyButtonText.value = t('jwt.copied')
            setTimeout(() => {
                copyButtonText.value = t('jwt.copy')
            }, 2000)
        }
    }
}
</script>

<template>
    <UContainer>
        <div class="py-8">
            <h1 class="text-3xl font-bold mb-4 font-[Impact]">
                {{ t('common.home') }}
            </h1>

            <!-- Loader elegante durante carga inicial -->
            <div v-if="!isInitialized" class="flex items-center justify-center min-h-64">
                <div class="flex flex-col items-center gap-4">
                    <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-muted text-sm">
                        {{ t('jwt.loading') }}
                    </p>
                </div>
            </div>

            <!-- Contenido solo después de inicializar -->
            <template v-else>
                <!-- Usuario autenticado -->
                <div v-if="session.data?.user" class="flex flex-col gap-6">
                    <!-- JWT Token Section con UCollapsible -->
                    <UCollapsible v-model:open="jwtExpanded">
                        <UButton 
                            variant="soft" 
                            color="primary"
                            block
                            class="justify-between"
                        >
                            <span class="flex items-center gap-2">
                                <UIcon name="i-heroicons-key" />
                                {{ t('jwt.title') }}
                            </span>
                            <UIcon 
                                :name="jwtExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                            />
                        </UButton>

                        <template #content>
                            <UCard class="mt-2">
                                <div class="space-y-4">
                                    <!-- Header del card con botón de copiar -->
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-muted">
                                            {{ t('jwt.sessionInfo') }}
                                        </span>
                                        <UButton 
                                            @click="copyToken" 
                                            size="sm"
                                            variant="ghost"
                                            :disabled="!jwtToken || jwtPending"
                                        >
                                            <span class="flex items-center gap-2">
                                                <UIcon name="i-heroicons-clipboard-document" />
                                                {{ jwtPending ? t('jwt.loading') : copyButtonText }}
                                            </span>
                                        </UButton>
                                    </div>

                                    <!-- Contenido del JWT -->
                                    <div class="bg-muted/50 p-3 rounded-lg border">
                                        <div v-if="jwtPending" class="flex items-center justify-center py-4">
                                            <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        <code v-else-if="jwtToken" class="text-xs text-foreground break-all block">
                                            {{ jwtToken }}
                                        </code>
                                        <div v-else class="text-muted text-sm py-2 text-center">
                                            {{ t('jwt.noToken') }}
                                        </div>
                                    </div>
                                </div>
                            </UCard>
                        </template>
                    </UCollapsible>

                    <!-- Session Info -->
                    <UCard>
                        <template #header>
                            <h2 class="text-lg font-semibold">
                                {{ t('jwt.sessionInfo') }}
                            </h2>
                        </template>
                        <div class="bg-muted/50 p-3 rounded-lg overflow-auto max-h-96">
                            <pre class="text-xs text-foreground">{{ JSON.stringify(session, null, 2) }}</pre>
                        </div>
                    </UCard>
                </div>

                <!-- Usuario no autenticado -->
                <UCard v-else>
                    <div class="flex flex-col items-center gap-4 py-6">
                        <p class="text-muted text-center">
                            Sign in to access your dashboard and profile
                        </p>
                        <div class="flex gap-3">
                            <UButton to="/auth/login">
                                {{ t('common.login') }}
                            </UButton>
                            <UButton to="/auth/register" variant="soft">
                                {{ t('common.register') }}
                            </UButton>
                        </div>
                    </div>
                </UCard>

                <!-- Link a contenido de ejemplo -->
                <NuxtLink to="/example-content" class="text-primary hover:underline">
                    Example Content
                </NuxtLink>
            </template>
        </div>
    </UContainer>
</template>
