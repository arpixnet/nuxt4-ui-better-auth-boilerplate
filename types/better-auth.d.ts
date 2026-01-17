/**
 * Better-Auth Type Extensions
 * 
 * This file extends the Better-Auth type definitions to include
 * the `twoFactor` plugin methods and the `twoFactorRedirect` property
 * that is returned when using the twoFactor plugin.
 */

declare module "better-auth/vue" {
  interface SignIn {
    email: {
      data: {
        user: {
          id: string
          createdAt: Date
          updatedAt: Date
          email: string
          emailVerified: boolean
          name: string
          image?: string | null
          twoFactorEnabled?: boolean
        }
        twoFactorRedirect?: boolean
        redirect: boolean
        token: string
        url?: string
      }
    }
  }

  // Two Factor plugin methods
  interface AuthClient {
    twoFactor: {
      enable: (options: { password: string }) => Promise<{
        data?: {
          secret: string
          totpURI: string
          backupCodes: string[]
        }
        error?: {
          message: string
        }
      }>
      verifyTotp: (options: { code: string; trustDevice?: boolean }) => Promise<{
        data?: any
        error?: {
          message: string
        }
      }>
      disable: (options: { password: string }) => Promise<{
        data?: any
        error?: {
          message: string
        }
      }>
    }
  }
}

declare module "better-auth" {
  interface SignIn {
    email: {
      data: {
        user: {
          id: string
          createdAt: Date
          updatedAt: Date
          email: string
          emailVerified: boolean
          name: string
          image?: string | null
          twoFactorEnabled?: boolean
        }
        twoFactorRedirect?: boolean
        redirect: boolean
        token: string
        url?: string
      }
    }
  }
}
