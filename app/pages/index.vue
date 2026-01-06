<script setup lang="ts">
    import { authClient } from "~/lib/auth-client";
    const session = authClient.useSession();
    // const session = await authClient.useSession(useFetch);
</script>

<template>
    <div>{{ session }}</div>
    <div class="w-full min-h-screen p-10">
        <h1 class="text-3xl font-bold mb-4 font-[Impact]">Home</h1>
        <NuxtLink to="/example-content" class="text-blue-600 hover:underline">Example Content</NuxtLink>
    </div>
</template>

<style lang="scss" scoped>

</style>
