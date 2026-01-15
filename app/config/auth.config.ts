/**
 * Authentication Pages Configuration
 * 
 * This file contains technical settings for login and register pages.
 * All text content is managed through i18n (en.json, es.json).
 * 
 * Modify these values to personalize the visual appearance.
 */

export interface AuthPageConfig {
  logo: {
    imageUrl?: string
    imageAlt?: string
    size: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  }
  decorativePanel: {
    login: {
      gradient: {
        light: {
          from: string
          via: string
          to: string
        }
        dark: {
          from: string
          via: string
          to: string
        }
      }
      backgroundImage?: string
    }
    register: {
      gradient: {
        light: {
          from: string
          via: string
          to: string
        }
        dark: {
          from: string
          via: string
          to: string
        }
      }
      backgroundImage?: string
    }
  }
}

export const authConfig: AuthPageConfig = {
  logo: {
    size: '2xl',
    // imageUrl: '/logo.svg', // Uncomment and set path to use an image logo
    // imageAlt: 'Company Logo',
  },
  decorativePanel: {
    login: {
      gradient: {
        light: {
          from: 'black',
          via: '#7f18e0',
          to: 'purple-500',
        },
        dark: {
          from: 'gray-900',
          via: 'purple-900',
          to: 'pink-900',
        },
      },
      // backgroundImage: '/images/login-bg.jpg', // Optional background image
    },
    register: {
      gradient: {
        light: {
          from: 'black',
          via: '#7f18e0',
          to: 'purple-500',
        },
        dark: {
          from: 'gray-900',
          via: 'purple-900',
          to: 'pink-900',
        },
      },
      // backgroundImage: '/images/register-bg.jpg', // Optional background image
    },
  },
}
