import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { Pool } from "pg"

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
    const provider = parts[2].toLowerCase()
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
  
  // Return all providers without validation
  // Better-Auth will handle validation and throw errors if something is missing
  return providersMap
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
    connectionString: process.env.DATABASE_URL || "",
  }),

  session: {
    expiresIn: parseInt(process.env.BETTER_AUTH_SESSION_EXPIRES_IN || "") || 60 * 60 * 24 * 7,
    updateAge: parseInt(process.env.BETTER_AUTH_SESSION_UPDATE_AGE || "") || 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: parseInt(process.env.BETTER_AUTH_COOKIE_MAX_AGE || "") || 5 * 60,
      strategy: "jwt",
      refreshCache: true,
    }
  },

  plugins: [
    jwt({
      jwt: {
        expirationTime: process.env.BETTER_AUTH_JWT_EXPIRATION_TIME || "7d",
        issuer: process.env.BETTER_AUTH_URL || "http://localhost:3000",
        audience: ["hasura"],

        definePayload: async ({ user, session }) => {
          const hasuraEnabled = process.env.BETTER_AUTH_WITH_HASURA === "true"

          const base = {
            sub: user.id,
            email: user.email,
            sessionId: session.id,
          }

          if (!hasuraEnabled) return base

          // Hasura JWT claims
          // Note: Roles and permissions are project-specific.
          // Uncomment and customize as needed:
          //
          // const rolesData = await getUserRolesAndOrganization(user.id)
          //
          // return {
          //   ...base,
          //   "https://hasura.io/jwt/claims": {
          //     "x-hasura-default-role": rolesData.defaultRole,
          //     "x-hasura-allowed-roles": rolesData.allowedRoles,
          //     "x-hasura-user-id": user.id,
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
  ],

  socialProviders: buildSocialProviders(),

  // Required for Apple Sign In
  trustedOrigins: ["https://appleid.apple.com"],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.BETTER_AUTH_EMAIL_VERIFICATION === "true",
  },
})
