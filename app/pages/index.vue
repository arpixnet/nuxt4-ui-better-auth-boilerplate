<script setup lang="ts">
    // En Nuxt 4, los composables son auto-importables
    const { session, pending } = useAuthSession();
    
    // Estado para controlar si ya se inicializó la sesión
    const isInitialized = ref(false);
    
    // Marcar como inicializado cuando termine de cargar
    watchEffect(() => {
        if (!pending.value) {
            isInitialized.value = true;
        }
    });
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
            <div v-if="session" class="mb-4">
                <!-- Logout Component -->
                <div class="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <AuthLogout />
                </div>
                
                <!-- Session Info -->
                <div class="mb-4 p-4 bg-gray-100 rounded">
                    <h2 class="text-xl font-bold mb-2">Session Info</h2>
                    <pre class="text-sm overflow-auto">{{ JSON.stringify(session, null, 2) }}</pre>
                </div>
            </div>
            
            <!-- Usuario no autenticado -->
            <div v-else class="mb-4 p-4 bg-red-100 rounded">
                <p class="text-red-700">No active session</p>
                <NuxtLink to="/auth/login" class="text-blue-600 hover:underline ml-2">
                    Sign in
                </NuxtLink>
            </div>
        </template>
        
        <NuxtLink to="/example-content" class="text-blue-600 hover:underline">
            Example Content
        </NuxtLink>
    </div>
</template>

<style lang="scss" scoped>

</style>
