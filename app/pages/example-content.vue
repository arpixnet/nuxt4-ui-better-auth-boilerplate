<script setup lang="ts">
    const { data: content, pending } = await useAsyncData(() => queryCollection('content').path('/example-content').first())
</script>

<template>
    <div class="w-full min-h-screen p-10">
        <div v-if="pending" class="p-4">
            <div class="skeleton h-8 mb-4"></div>
            <div class="skeleton h-4 mb-2"></div>
            <div class="skeleton h-4 w-3/4"></div>
        </div>
        <ContentRenderer
            v-else-if="content"
            :value="content"
            class="content-renderer loaded"
        />
        <div v-else>
            <p>No content found.</p>
            <p class="mt-2 font-semibold">Install @nuxt/content by running</p>
            <code class="w-fit mt-2 block bg-black text-white py-4 px-6 rounded-lg">npm run add:content</code>
        </div>
    </div>
</template>

<style lang="scss" scoped>

</style>
