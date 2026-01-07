<script setup lang="ts">
    // En Nuxt 4, los composables son auto-importables
    const { session, pending } = useAuthSession();
</script>

<template>
    <div class="w-full min-h-screen p-10">
        <h1 class="text-3xl font-bold mb-4 font-[Impact]">Home</h1>
        
        <div v-if="pending" class="mb-4 text-gray-500">
            Loading session...
        </div>
        
        <div v-else-if="session" class="mb-4 p-4 bg-gray-100 rounded">
            <h2 class="text-xl font-bold mb-2">Session Info</h2>
            <pre class="text-sm overflow-auto">{{ JSON.stringify(session, null, 2) }}</pre>
        </div>
        
        <div v-else class="mb-4 p-4 bg-red-100 rounded">
            <p class="text-red-700">No active session</p>
        </div>
        
        <NuxtLink to="/example-content" class="text-blue-600 hover:underline">
            Example Content
        </NuxtLink>
    </div>
</template>

<style lang="scss" scoped>

</style>
