import { defineAppConfig } from "nuxt/app";

// Determinar el modo de tema desde variable de entorno
const themeMode = (process.env.THEME_MODE || 'toggle') as 'light' | 'dark' | 'toggle'

export default defineAppConfig({
  ui: {
    // Configuración básica para Nuxt UI v4
  },
  themeMode
})
