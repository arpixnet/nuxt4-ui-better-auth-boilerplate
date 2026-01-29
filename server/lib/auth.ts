import { betterAuth } from "better-auth"
import { jwt, twoFactor } from "better-auth/plugins"
import { Pool } from "pg"
import { authLogger, emailLogger, logError } from "../utils/logger"



/**
 * Type definitions for email hooks
 */
interface EmailHookUser {
  id: string
  email: string
  name?: string
  [key: string]: any
}

/**
 * Type definitions for sign up hook
 */
interface SignUpHookParams {
  email: string
  password: string
  name?: string
}

/**
 * Convert SNAKE_CASE to camelCase
 *
 * Examples:
 *   CLIENT_ID -> clientId
 *   CLIENT_SECRET -> clientSecret
 *   CLIENT_KEY -> clientKey
 *   APP_BUNDLE_IDENTIFIER -> appBundleIdentifier
 *   TENANT_ID -> tenantId
 */
const toCamelCase = (str: string): string => {
  return str
    .toLowerCase()
    .split("_")
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("")
}

/**
 * Parse environment variable value to appropriate type
 *
 * - If value contains comma, split into array
 * - Otherwise return as string
 *
 * Examples:
 *   "read,submit" -> ["read", "submit"]
 *   "clientId" -> "clientId"
 *   "user:read,email" -> ["user:read", "email"]
 */
const parseEnvValue = (value: string): string | string[] => {
  // Check if it's an array (contains comma)
  if (value.includes(',')) {
    return value.split(',').map(item => item.trim())
  }
  return value
}

/**
 * Build social providers from SOCIAL_PROVIDER_* environment variables
 *
 * Convention: SOCIAL_PROVIDER_{PROVIDER}_{FIELD_NAME}
 *
 * Arrays: Use comma-separated values
 * Example: SOCIAL_PROVIDER_REDDIT_SCOPE=read,submit
 *
 * Examples:
 *   SOCIAL_PROVIDER_GOOGLE_CLIENT_ID -> google.clientId
 *   SOCIAL_PROVIDER_TIKTOK_CLIENT_KEY -> tiktok.clientKey
 *   SOCIAL_PROVIDER_PAYPAL_CLIENT_SECRET -> paypal.clientSecret
 *   SOCIAL_PROVIDER_APPLE_APP_BUNDLE_IDENTIFIER -> apple.appBundleIdentifier
 *   SOCIAL_PROVIDER_REDDIT_SCOPE=read,submit -> reddit.scope: ["read", "submit"]
 *
 * Features:
 * - 100% DYNAMIC: Works with ANY provider (Google, PayPal, Twitter, etc.)
 * - Automatic SNAKE_CASE to camelCase conversion
 * - Automatic array detection (comma-separated values)
 * - NO PRE-VALIDATION: Better-Auth handles validation and errors
 * - No code changes needed for new providers
 */
const buildSocialProviders = () => {
  // Find all SOCIAL_PROVIDER_* environment variables
  const providerVars = Object.keys(process.env)
    .filter(key => key.startsWith("SOCIAL_PROVIDER_"))

  // Group variables by provider name
  const providersMap: Record<string, Record<string, string | string[]>> = {}

  for (const varName of providerVars) {
    const value = process.env[varName]
    if (!value) continue

    // Extract provider and field name
    // Format: SOCIAL_PROVIDER_GOOGLE_CLIENT_ID
    const parts = varName.split("_")
    if (parts.length < 4) continue // Skip malformed variables
    const provider = parts[2]?.toLowerCase() || ''
    const rawField = parts.slice(3).join("_") // CLIENT_ID

    // Convert SNAKE_CASE to camelCase
    const field = toCamelCase(rawField)

    // Parse value (string or array)
    const parsedValue = parseEnvValue(value)

    if (!providersMap[provider]) {
      providersMap[provider] = {}
    }

    providersMap[provider][field] = parsedValue
  }

  // Log loaded providers
  const loadedProviders = Object.keys(providersMap)
  if (loadedProviders.length > 0) {
    authLogger.debug({ providers: loadedProviders }, 'Social providers loaded')
  } else {
    authLogger.debug('No social providers configured')
  }

  // Return all providers without validation
  // Better-Auth will handle validation and throw errors if something is missing
  return providersMap
}

/**
 * Check if registration is allowed
 *
 * This function checks the ALLOW_REGISTRATION environment variable
 * to determine if new user registration is permitted.
 */
const isRegistrationAllowed = (): boolean => {
  const allowed = process.env.ALLOW_REGISTRATION !== "false"
  if (!allowed) {
    authLogger.warn('Registration is currently disabled')
  }
  return allowed
}

/**
 * Better-Auth Server Configuration
 *
 * Flexible boilerplate that works with:
 * - Hasura GraphQL Engine or direct database access
 * - ANY social provider via SOCIAL_PROVIDER_* convention (100% dynamic)
 * - Email/password authentication
 *
 * Social Providers Configuration:
 * Use SOCIAL_PROVIDER_{PROVIDER}_{FIELD} convention in .env
 * All fields in SNAKE_CASE, automatically converted to camelCase
 *
 * Examples:
 *   SOCIAL_PROVIDER_GOOGLE_CLIENT_ID=xxx
 *   SOCIAL_PROVIDER_GOOGLE_CLIENT_SECRET=xxx
 *   SOCIAL_PROVIDER_TIKTOK_CLIENT_KEY=xxx
 *   SOCIAL_PROVIDER_PAYPAL_CLIENT_SECRET=xxx
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "",

  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),

  logger: {
    level: "debug",
  },

  session: {
    expiresIn: parseInt(process.env.BETTER_AUTH_SESSION_EXPIRES_IN || "") || 60 * 60 * 24 * 7,
    updateAge: parseInt(process.env.BETTER_AUTH_SESSION_UPDATE_AGE || "") || 60 * 60 * 24,
    cookieCache: {
      enabled: false,
      maxAge: parseInt(process.env.BETTER_AUTH_COOKIE_MAX_AGE || "") || 5 * 60,
      strategy: "jwt",
    }
  },

  user: {
    deleteUser: {
      enabled: true,
    },
  },

  plugins: [
    jwt({
      jwt: {
        expirationTime: process.env.BETTER_AUTH_JWT_EXPIRATION_TIME || "7d",
        issuer: process.env.BETTER_AUTH_URL || "http://localhost:3000",
        audience: ["hasura"],

        definePayload: async ({ user, session }) => {
          const base = {
            sub: user.id,
            email: user.email,
            sessionId: session.id,
          }

          // Hasura JWT claims are always included when Hasura is configured
          // The BETTER_AUTH_WITH_HASURA env var controls this behavior
          const hasuraEnabled = process.env.BETTER_AUTH_WITH_HASURA === "true"

          if (!hasuraEnabled) return base

          // Hasura JWT claims
          // These claims are used by Hasura for authorization and permissions
          // Customize roles and permissions based on your application requirements
          //
          // Advanced: Fetch user roles from database
          // const rolesData = await getUserRolesAndOrganization(user.id)
          //
          // return {
          //   ...base,
          //   "https://hasura.io/jwt/claims": {
          //     "x-hasura-default-role": rolesData.defaultRole,
          //     "x-hasura-allowed-roles": rolesData.allowedRoles,
          //     "x-hasura-user-id": user.id,
          //     "x-hasura-org-id": rolesData.orgId,
          //   },
          // }

          return {
            ...base,
            "https://hasura.io/jwt/claims": {
              "x-hasura-user-id": user.id,
            },
          }
        },
      },
    }),
    twoFactor({
      issuer: process.env.APP_NAME || "Arpix App"
    }),
  ],

  socialProviders: buildSocialProviders(),

  // Required for Apple Sign In
  trustedOrigins: ["https://appleid.apple.com"],

  // Database Table Names Configuration
  // Match our SQL migration table names exactly
  verification: {
    modelName: "verification",
  },

  twoFactor: {
    modelName: "twoFactor",
  },

  // Email Verification Configuration
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }: { user: EmailHookUser, url: string, token: string }) => {
      try {
        // Check if registration is allowed
        if (!isRegistrationAllowed()) {
          authLogger.warn({ email: user.email }, 'Registration attempt when disabled')
          throw new Error('Registration is currently disabled')
        }

        const requiresVerification = process.env.BETTER_AUTH_EMAIL_VERIFICATION === "true"

        emailLogger.info({
          email: user.email,
          userName: user.name,
          requiresVerification,
        }, 'Sending verification email')

        // Send welcome email with verification link
        // This hook is called ONLY on sign-up (sendOnSignUp: true, sendOnSignIn: false)
        const response = await fetch(`${process.env.BETTER_AUTH_URL}/api/email/send-welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: user.email,
            userName: user.name || user.email.split('@')[0],
            verificationLink: requiresVerification ? url : undefined,
            loginUrl: `${process.env.BETTER_AUTH_URL}/auth/login`,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          logError(emailLogger, errorText, 'Failed to send welcome email', {
            email: user.email,
            status: response.status,
          })
        } else {
          emailLogger.info({ email: user.email }, 'Welcome email sent successfully')
        }
      } catch (error) {
        logError(emailLogger, error, 'Failed to send welcome email', { email: user.email })
        // Don't throw error to allow registration to complete even if email fails
      }
    },
    sendOnSignUp: true, // Send verification email on registration
    autoSignInAfterVerification: true, // Automatically sign in after verification
    sendOnSignIn: false, // Don't send on sign-in - we handle this separately in login page
    expiresIn: 3600, // Token expires in 1 hour
  },

  // Email & Password Authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.BETTER_AUTH_EMAIL_VERIFICATION === "true",
    signUp: async ({ email, name }: SignUpHookParams) => {
      // Log sign-up attempt
      authLogger.info({ email, name }, 'Sign-up attempt')

      // Check if registration is allowed before processing
      if (!isRegistrationAllowed()) {
        authLogger.warn({ email }, 'Sign-up blocked: registration disabled')
        throw new Error('Registration is currently disabled')
      }

      authLogger.info({ email }, 'Sign-up completed successfully')
    },
    sendResetPassword: async ({ user, url }: { user: EmailHookUser, url: string }) => {
      try {
        emailLogger.info({
          email: user.email,
          userName: user.name,
        }, 'Sending password reset email')

        // Call internal API endpoint to send reset password email
        const response = await fetch(`${process.env.BETTER_AUTH_URL}/api/email/send-reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: user.email,
            userName: user.name || user.email.split('@')[0],
            resetLink: url,
            loginUrl: `${process.env.BETTER_AUTH_URL}/auth/login`,
            ipAddress: 'Unknown', // Can be enhanced with request IP
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          logError(emailLogger, errorText, 'Failed to send reset password email', {
            email: user.email,
            status: response.status,
          })
        } else {
          emailLogger.info({ email: user.email }, 'Reset password email sent successfully')
        }
      } catch (error) {
        logError(emailLogger, error, 'Failed to send reset password email', { email: user.email })
        // Don't throw error to allow reset request to complete even if email fails
      }
    },
  },
})
