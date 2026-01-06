import { createAuthClient } from "better-auth/vue"
import { jwtClient } from "better-auth/client/plugins"

// Singleton client instance
let authClientInstance: ReturnType<typeof createAuthClient> | null = null

/**
 * Better-Auth Client Composable
 * 
 * This composable returns a singleton instance of the client-side
 * authentication client that communicates with Better-Auth server endpoints.
 * 
 * It includes JWT plugin to enable JWT token retrieval.
 * 
 * Usage in Vue component:
 * const { authClient } = useAuthClient()
 * 
 * Usage in non-Vue file:
 * Not supported - must be called from Vue setup, plugin, or composable
 */
export const useAuthClient = () => {
  const config = useRuntimeConfig()
  
  // Create singleton instance if not exists
  if (!authClientInstance) {
    authClientInstance = createAuthClient({
      baseURL: config.public.betterAuth.url,
      plugins: [
        jwtClient(),
      ],
    })
  }
  
  return authClientInstance
}

/**
 * Type definitions for Better-Auth client
 */
export type AuthClient = ReturnType<typeof createAuthClient>
