/**
 * Authentication Pages Configuration
 * 
 * This file contains all customizable settings for login and register pages.
 * Modify these values to personalize your authentication experience.
 */

export interface AuthPageConfig {
  logo: {
    text: string
    size: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    imageUrl?: string
    imageAlt?: string
  }
  decorativePanel: {
    login: {
      title: string
      subtitle: string
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
      title: string
      subtitle: string
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
  formSubtitle: {
    login: string
    register: string
  }
}

export const authConfig: AuthPageConfig = {
  logo: {
    text: 'Arpix Solutions',
    size: '2xl',
    // imageUrl: '/logo.svg', // Uncomment and set path to use an image logo
    // imageAlt: 'Company Logo',
  },
  formSubtitle: {
    login: 'Log in to continue your application journey',
    register: 'Join us to get started with your application',
  },
  decorativePanel: {
    login: {
      title: 'Welcome to Arpix Solutions',
      subtitle: 'Your trusted partner for innovative solutions',
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
      title: 'Join Arpix Solutions Today',
      subtitle: 'Start your journey with us today',
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