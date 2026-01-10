// https://nuxt.com/docs/api/configuration/nuxt-config

// Type definition for Better-Auth public runtime config
interface BetterAuthRuntimeConfig {
  url: string
  emailVerification?: boolean
  defaultRedirect: string
}

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
    'nuxt-arpix-email-sender',
    optionalModule('@nuxt/content')
  ].filter(Boolean),

  css: [
    '~/assets/css/main.css',
    optionalModule('@nuxt/content') ? '~/assets/css/content.css' : undefined
  ].filter(Boolean),
  image: {
    format: ['avif', 'webp'],
    provider: 'ipx',
    quality: 80,
    densities: [1, 2],
    ipx: {
      maxAge: 60 * 60 * 24 * 365
    }
    // domains: ['example.com']
  },
  
  // Uncomment to enable content preview (Nuxt Studio)
  // content: {
  //   preview: {
  //     api: 'https://api.nuxt.studio'
  //   }
  // },

  arpixEmailSender: {
    transport: 'smtp',
    defaultFrom: '"Example Test" <info@ebppublicidad.com>',
    smtp: {
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER || 'info@ebppublicidad.com',
        clientId: process.env.GMAIL_CLIENT_ID || '',
        clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
        refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
      }
    },
    templates: {
      dir: 'server/emails/templates',
    },
  },

  nitro: {
    compressPublicAssets: true
  },

  runtimeConfig: {
    public: {
      appName: process.env.APP_NAME || "Arpix Solutions",
      betterAuth: {
        url: process.env.BETTER_AUTH_URL || "http://localhost:3000",
        emailVerification: process.env.BETTER_AUTH_EMAIL_VERIFICATION === "true",
        defaultRedirect: process.env.BETTER_AUTH_DEFAULT_REDIRECT || "/"
      } as BetterAuthRuntimeConfig
    }
  }
})
