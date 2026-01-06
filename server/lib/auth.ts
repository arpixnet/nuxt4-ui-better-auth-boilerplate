import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { Pool } from "pg"

const config = useRuntimeConfig()

/**
 * Provider configuration schema
 * Maps each provider to its required and optional fields
 */
type ProviderFieldsConfig = {
  fields: string[]
  optional?: string[]
}

const PROVIDER_CONFIG: Record<string, ProviderFieldsConfig> = {
  // Standard OAuth 2.0 providers
  google: { fields: ['clientId', 'clientSecret'] },
  facebook: { fields: ['clientId', 'clientSecret'] },
  github: { fields: ['clientId', 'clientSecret'] },
  discord: { fields: ['clientId', 'clientSecret'] },
  linkedin: { fields: ['clientId', 'clientSecret'] },
  spotify: { fields: ['clientId', 'clientSecret'] },
  twitch: { fields: ['clientId', 'clientSecret'] },
  
  // Special providers
  tiktok: { fields: ['clientKey', 'clientSecret'] },
  
  // Providers with optional configuration
  microsoft: { 
    fields: ['clientId', 'clientSecret'],
    optional: ['tenantId', 'authority', 'prompt']
  },
  apple: { 
    fields: ['clientId', 'clientSecret'],
    optional: ['teamId', 'keyId', 'privateKey']
  },
}

/**
 * Build social providers configuration
 * 
 * Priority order:
 * 1. Explicit config in runtimeConfig.betterAuth.providers
 * 2. Environment variables with custom fields
 * 3. Standard CLIENT_ID/CLIENT_SECRET pattern
 */
const buildSocialProviders = () => {
  const providers: Record<string, Record<string, string>> = {}
  
  // 1. Check if there's explicit provider config in runtimeConfig
  const explicitProviders = config.betterAuth?.providers || {}
  
  // 2. Build providers from environment variables
  const providerNames = Object.keys(PROVIDER_CONFIG) as Array<keyof typeof PROVIDER_CONFIG>
  
  for (const providerName of providerNames) {
    // Skip if already configured in runtimeConfig
    if (explicitProviders[providerName]) {
      providers[providerName] = explicitProviders[providerName]
      continue
    }
    
    const providerConfig = PROVIDER_CONFIG[providerName]
    const providerConfigObj: Record<string, string> = {}
    
    // Read required fields
    let hasRequiredFields = false
    for (const field of providerConfig.fields) {
      const envVar = `${providerName.toUpperCase()}_${field.toUpperCase()}`
      const value = process.env[envVar]
      
      if (value) {
        providerConfigObj[field] = value
        hasRequiredFields = true
      }
    }
    
    // Read optional fields
    if (providerConfig.optional && hasRequiredFields) {
      for (const field of providerConfig.optional) {
        const envVar = `${providerName.toUpperCase()}_${field.toUpperCase()}`
        const value = process.env[envVar]
        
        if (value) {
          providerConfigObj[field] = value
        }
      }
    }
    
    // Only add provider if it has at least one field configured
    if (hasRequiredFields) {
      providers[providerName] = providerConfigObj
    }
  }
  
  return providers
}

/**
 * Better-Auth Server Configuration
 * 
 * Flexible boilerplate that works with:
 * - Hasura GraphQL Engine or direct database access
 * - Any number of social providers (dynamic configuration)
 * - Custom provider configurations via runtimeConfig
 * - Email/password authentication
 */
export const auth = betterAuth({
  baseURL: config.betterAuth.url,
  secret: config.betterAuth.secret,

  database: new Pool({
    connectionString: config.databaseUrl,
  }),

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      strategy: "jwt",
      refreshCache: true,
    }
  },

  plugins: [
    jwt({
      jwt: {
        expirationTime: "7d",
        issuer: config.betterAuth.url,
        audience: ["hasura"],

        definePayload: async ({ user, session }) => {
          const hasuraEnabled = config.betterAuth.withHasura

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

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: config.betterAuth.emailVerification || false,
  },
})
