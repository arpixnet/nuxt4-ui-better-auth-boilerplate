import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { Pool } from "pg"

const config = useRuntimeConfig()

/**
 * Better-Auth Server Configuration
 *
 * Configures authentication with JWT support and custom Hasura claims.
 * The JWT tokens include x-hasura-* claims required by Hasura GraphQL Engine.
 */
export const auth = betterAuth({
  // Base URL para tu aplicación
  baseURL: config.betterAuth.url,
  // Secret for signing sessions and tokens
  secret: config.betterAuth.secret,

  // Database configuration
  database: new Pool({
    connectionString: config.databaseUrl,
  }),

  // Configuración de sesión con soporte JWT para Hasura
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      strategy: "jwt",
      refreshCache: true,
    }
  },

  // Plugin JWT para generar tokens compatibles con Hasura
  plugins: [
    // JWT plugin with custom Hasura claims
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

          // Enable if you want to use Hasura
          // const rolesData = await getUserRolesAndOrganization(user.id)

          return {
            ...base,
            "https://hasura.io/jwt/claims": {
              // "x-hasura-default-role": rolesData.defaultRole,
              // "x-hasura-allowed-roles": rolesData.allowedRoles,
              "x-hasura-user-id": user.id,
            },
          }
        },
      },
    }),
  ],

  // Social providers (Google, Facebook, etc.)
  socialProviders: {
    google: {
      clientId: config.socialProviders.google.clientId,
      clientSecret: config.socialProviders.google.clientSecret,
    },
    // ... more providers
  },

  // email/password credentials
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
});
