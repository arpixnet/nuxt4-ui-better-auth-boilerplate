import { createAuthClient } from "better-auth/vue"
import { jwtClient, twoFactorClient } from "better-auth/client/plugins"



// Singleton client instance
let authClientInstance: any = null

/**
 * Better-Auth Client Composable
 * 
 * This composable returns a singleton instance of the client-side
 * authentication client that communicates with Better-Auth server endpoints.
 * 
 * Features:
 * - JWT plugin for token management
 * - 401 interceptor for automatic session expiration handling
 * - Singleton pattern for optimal performance
 * 
 * Usage in Vue component:
 * const authClient = useAuthClient()
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
        twoFactorClient(),
      ],
      fetchOptions: {
        // Global error handler for all API calls
        onError: async (context) => {
          const { response } = context
          
          // Handle 401 Unauthorized - Session expired or invalid
          if (response?.status === 401) {
            console.warn('[Auth Client] 401 Unauthorized - Session expired or invalid')
            
            // Only redirect on client-side
            if (import.meta.client) {
              // Clear local session state
              try {
                // Get current route to preserve redirect
                const router = useRouter()
                const currentPath = router.currentRoute.value.fullPath
                
                // Redirect to login with return URL
                await navigateTo({
                  path: '/auth/login',
                  query: { 
                    redirect: currentPath,
                    expired: 'true' // Flag to show "session expired" message
                  }
                })
              } catch (error) {
                console.error('[Auth Client] Error during 401 redirect:', error)
                // Fallback: just go to login
                window.location.href = '/auth/login?expired=true'
              }
            }
          }
          
          // Handle 403 Forbidden - Insufficient permissions
          if (response?.status === 403) {
            console.warn('[Auth Client] 403 Forbidden - Insufficient permissions')
          }
          
          // Handle 429 Too Many Requests - Rate limited
          if (response?.status === 429) {
            console.warn('[Auth Client] 429 Too Many Requests - Rate limited')
          }
        }
      }
    })
  }
  
  return authClientInstance
}

/**
 * Type definitions for Better-Auth client
 */
export type AuthClient = ReturnType<typeof createAuthClient>
