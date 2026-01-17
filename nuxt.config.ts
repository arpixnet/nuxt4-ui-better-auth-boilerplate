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

// Determine theme mode from environment variable
const themeMode = process.env.THEME_MODE || 'toggle'

// Configure color mode preference based on THEME_MODE
const colorModePreference = themeMode === 'light' 
  ? 'light' 
  : themeMode === 'dark' 
    ? 'dark' 
    : 'system'

// For forced modes, disable storage to prevent conflicts
const colorModeConfig: any = {
  preference: colorModePreference,
  fallback: 'dark',
  storageKey: 'arpix_color_mode'
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/ui',
    '@nuxtjs/seo',
    'nuxt-arpix-email-sender',
    '@nuxtjs/i18n',
    optionalModule('@nuxt/content')
  ].filter(Boolean),

  css: [
    '~/assets/css/main.css',
    optionalModule('@nuxt/content') ? '~/assets/css/content.css' : undefined
  ].filter(Boolean),
  colorMode: colorModeConfig,
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

  site: {
    url: process.env.BASE_URL || 'http://localhost:3000',
    name: process.env.APP_NAME || 'Arpix App',
    description: 'Production ready Nuxt 4 boilerplate with Better-Auth',
    defaultLocale: 'es',
  },

  // Uncomment to enable content preview (Nuxt Studio)
  // content: {
  //   preview: {
  //     api: 'https://api.nuxt.studio'
  //   }
  // },

  i18n: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    locales: [
      { code: 'es', language: 'es-ES', file: 'es.json', flag: '🇪🇸', name: 'Español', shortName: 'ES' },
      { code: 'en', language: 'en-US', file: 'en.json', flag: '🇬🇧', name: 'English', shortName: 'EN' }
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: false,
      cookieCrossOrigin: process.env.NODE_ENV === 'production'
    }
  },

  arpixEmailSender: {
    transport: 'smtp',
    defaultFrom: process.env.EMAIL_FROM || '"Your App" <noreply@example.com>',
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
      allowRegistration: process.env.ALLOW_REGISTRATION !== "false",
      themeMode: themeMode as 'light' | 'dark' | 'toggle',
      betterAuth: {
        url: process.env.BETTER_AUTH_URL || "http://localhost:3000",
        emailVerification: process.env.BETTER_AUTH_EMAIL_VERIFICATION === "true",
        defaultRedirect: process.env.BETTER_AUTH_DEFAULT_REDIRECT || "/"
      } as BetterAuthRuntimeConfig
    }
  }
})
