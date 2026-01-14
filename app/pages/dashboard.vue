<script setup lang="ts">
// Protect this route with auth middleware
definePageMeta({
  middleware: 'auth',
  requiresAuth: true
})

const { session, pending } = useAuthSession()

// Estado para controlar si ya se inicializó la sesión
const isInitialized = ref(false)

// Marcar como inicializado cuando termine de cargar
watchEffect(() => {
  if (!pending.value) {
    isInitialized.value = true
  }
})
</script>

<template>
  <div class="w-full min-h-screen p-10">
    <h1 class="text-3xl font-bold mb-4">Dashboard</h1>

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

        <!-- Dashboard Content -->
        <div class="mb-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 class="text-xl font-bold mb-4">Welcome to Your Dashboard</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            This is a protected route. Only authenticated users can see this page.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NuxtLink to="/profile"
              class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
              <h3 class="font-semibold text-blue-900 dark:text-blue-100">Profile</h3>
              <p class="text-sm text-blue-700 dark:text-blue-300">Manage your account</p>
            </NuxtLink>

            <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 class="font-semibold text-green-900 dark:text-green-100">Settings</h3>
              <p class="text-sm text-green-700 dark:text-green-300">Configure preferences</p>
            </div>

            <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 class="font-semibold text-purple-900 dark:text-purple-100">Activity</h3>
              <p class="text-sm text-purple-700 dark:text-purple-300">View your history</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <UButton to="/" variant="link" color="neutral">
      ← Back to Home
    </UButton>
  </div>
</template>
