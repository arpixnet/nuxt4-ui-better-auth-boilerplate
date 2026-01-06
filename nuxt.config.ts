// https://nuxt.com/docs/api/configuration/nuxt-config

// Helper function to conditionally load modules
function optionalModule(name: string) {
  try {
    require.resolve(name)
    return name
  } catch {
    return undefined
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/ui',
    optionalModule('@nuxt/content')
  ].filter(Boolean),

  css: [
    '~/assets/css/main.css',
    optionalModule('@nuxt/content') ? '~/assets/css/content.css' : undefined
  ].filter(Boolean),
  image: {
    format: ['webp'],
    provider: 'ipx',
    // domains: ['example.com']
  },

  // Uncomment to enable content preview (Nuxt Studio)
  // content: {
  //   preview: {
  //     api: 'https://api.nuxt.studio'
  //   }
  // },

  nitro: {
    compressPublicAssets: true
  },

  runtimeConfig: {
    public: {
      betterAuth: {
        url: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      }
    },
    betterAuth: {
      secret: process.env.BETTER_AUTH_SECRET || "",
      url: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      withHasura: process.env.BETTER_AUTH_WITH_HASURA === "true",
      emailVerification: process.env.BETTER_AUTH_EMAIL_VERIFICATION === "true"
    },
    databaseUrl: process.env.DATABASE_URL || "",
  }
})
