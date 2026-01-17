/**
 * Better-Auth Type Extensions
 * 
 * This file extends the Better-Auth type definitions to include
 * the `twoFactorRedirect` property that is returned when using the
 * twoFactor plugin.
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
        }
        twoFactorRedirect?: boolean
        redirect: boolean
        token: string
        url?: string
      }
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
        }
        twoFactorRedirect?: boolean
        redirect: boolean
        token: string
        url?: string
      }
    }
  }
}
