<script setup lang="ts">
import { useAuthClient } from '~/lib/auth-client'

// Mark this page as public (no auth required)
definePageMeta({
    requiresAuth: false
})

// En Nuxt 4, los composables son auto-importables
const { session, pending } = useAuthSession();
const authClient = useAuthClient();

// Estado para controlar si ya se inicializó la sesión
const isInitialized = ref(false);

// Estado para el JWT token
const jwtToken = ref<string | null>(null);
const jwtPending = ref(false);

// Estado para el botón de copiar
const copyButtonText = ref('Copy');

// Marcar como inicializado cuando termine de cargar
watchEffect(() => {
    if (!pending.value) {
        isInitialized.value = true;
    }
});

// Cargar el JWT token cuando el usuario esté autenticado
watchEffect(async () => {
    if (isInitialized.value && session.value.data?.user && !jwtToken.value) {
        try {
            jwtPending.value = true;
            const { data, error } = await authClient.token();
            if (data?.token) {
                jwtToken.value = data.token;
            }
            if (error) {
                console.error('[JWT] Error fetching token:', error);
            }
        } catch (error) {
            console.error('[JWT] Failed to fetch token:', error);
        } finally {
            jwtPending.value = false;
        }
    }
});

// Función para copiar el token al portapapeles
const copyToken = async () => {
    if (jwtToken.value) {
        try {
            await navigator.clipboard.writeText(jwtToken.value);
            copyButtonText.value = 'Copied!';
            setTimeout(() => {
                copyButtonText.value = 'Copy';
            }, 2000);
        } catch (error) {
            console.error('Failed to copy token:', error);
            // Fallback para navegadores que no soporten la API
            const textArea = document.createElement('textarea');
            textArea.value = jwtToken.value;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            copyButtonText.value = 'Copied!';
            setTimeout(() => {
                copyButtonText.value = 'Copy';
            }, 2000);
        }
    }
};
</script>

<template>
    <div class="w-full min-h-screen p-10">
        <h1 class="text-3xl font-bold mb-4 font-[Impact]">Home</h1>

        <!-- Loader elegante durante carga inicial -->
        <div v-if="!isInitialized" class="flex items-center justify-center min-h-64">
            <div class="flex flex-col items-center gap-4">
                <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-gray-500 text-sm">Loading...</p>
            </div>
        </div>

        <!-- Contenido solo después de inicializar -->
        <template v-else>
            <!-- Usuario autenticado -->
            <div v-if="session.data?.user" class="flex flex-col gap-4">
                <!-- Logout Component -->
                <AuthLogout />

                <!-- JWT Token Section -->
                <div class="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div class="flex items-center justify-between mb-2">
                        <h2 class="text-xl font-bold text-blue-900">JWT Token (Hasura)</h2>
                        <UButton 
                            @click="copyToken" 
                            color="primary" 
                            variant="soft" 
                            size="sm"
                            :disabled="!jwtToken || jwtPending"
                        >
                            <span class="flex items-center gap-2">
                                <UIcon name="i-heroicons-clipboard-document" />
                                {{ jwtPending ? 'Loading...' : copyButtonText }}
                            </span>
                        </UButton>
                    </div>
                    <div class="bg-white p-3 rounded border border-blue-200">
                        <div v-if="jwtPending" class="flex items-center justify-center py-4">
                            <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <code v-else-if="jwtToken" class="text-xs text-gray-800 break-all block">
                            {{ jwtToken }}
                        </code>
                        <div v-else class="text-gray-500 text-sm py-2">
                            No JWT token available
                        </div>
                    </div>
                </div>

                <!-- Session Info -->
                <div class="mb-4 p-4 bg-gray-100 rounded">
                    <h2 class="text-xl font-bold mb-2">Session Info</h2>
                    <pre class="text-sm overflow-auto">{{ JSON.stringify(session, null, 2) }}</pre>
                </div>
            </div>

            <!-- Usuario no autenticado -->
            <div v-else class="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-end">
                <div class="flex gap-3">
                    <UButton to="/auth/login" color="primary" variant="soft">
                        Sign in
                    </UButton>

                    <UButton to="/auth/register" color="secondary" variant="soft">
                        Sign up
                    </UButton>
                </div>
            </div>
        </template>

        <NuxtLink to="/example-content" class="text-blue-600 hover:underline">
            Example Content
        </NuxtLink>
    </div>
</template>
