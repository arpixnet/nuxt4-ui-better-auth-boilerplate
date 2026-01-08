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
  }
}

