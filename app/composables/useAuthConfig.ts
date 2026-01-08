import { authConfig, type AuthPageConfig } from '~/config/auth.config'

/**
 * Composable to access authentication configuration
 * 
 * @returns Authentication configuration object
 */
export const useAuthConfig = () => {
  return {
    config: authConfig,
    
    /**
     * Get logo configuration
     */
    getLogo: () => authConfig.logo,
    
    /**
     * Get decorative panel configuration for a specific page
     * @param page - 'login' or 'register'
     */
    getDecorativePanel: (page: 'login' | 'register') => {
      return authConfig.decorativePanel[page]
    },
    
    /**
     * Build gradient classes for Tailwind CSS
     * @param page - 'login' or 'register'
     * @param mode - 'light' or 'dark'
     */
    getGradientClasses: (page: 'login' | 'register', mode: 'light' | 'dark' = 'light') => {
      const panel = authConfig.decorativePanel[page]
      const gradient = panel.gradient[mode]
      
      return `from-${gradient.from} via-${gradient.via} to-${gradient.to}`
    },
    
  /**
   * Get form subtitle configuration for a specific page
   * @param page - 'login' or 'register'
   */
  getFormSubtitle: (page: 'login' | 'register') => {
    return authConfig.formSubtitle[page]
  },
  
  /**
   * Get gradient background style for Tailwind 4
   * Uses inline styles instead of dynamic Tailwind classes
   * @param page - 'login' or 'register'
   * @param mode - 'light' or 'dark'
   */
  getGradientStyle: (page: 'login' | 'register', mode: 'light' | 'dark' = 'light') => {
    const panel = authConfig.decorativePanel[page]
    const gradient = panel.gradient[mode]
    
    // Map Tailwind color names to CSS values
    const colorMap: Record<string, string> = {
      // Blues
      'blue-500': '#3b82f6',
      'blue-900': '#1e3a8a',
      // Purples
      'purple-500': '#a855f7',
      'purple-900': '#581c87',
      // Pinks
      'pink-500': '#ec4899',
      'pink-900': '#831843',
      // Greens
      'green-500': '#22c55e',
      'green-900': '#14532d',
      // Teals
      'teal-500': '#14b8a6',
      'teal-900': '#134e4a',
    }
    
    const fromColor = colorMap[gradient.from] || gradient.from
    const viaColor = colorMap[gradient.via] || gradient.via
    const toColor = colorMap[gradient.to] || gradient.to
    
    return {
      background: `linear-gradient(to bottom right, ${fromColor}, ${viaColor}, ${toColor})`,
    }
  },
}
}

