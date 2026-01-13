/**
 * Authentication Middleware
 * 
 * This middleware protects routes that require authentication.
 * Works on both server and client for proper SSR support.
 * 
 * Server-side: Quick cookie check for SSR
 * Client-side: Full session validation with Better-Auth
 * 
 * @example
 * ```vue
 * <script setup>
 * definePageMeta({
 *   middleware: 'auth',
 *   requiresAuth: true
 * })
 * </script>
 * ```
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip if route doesn't require auth
  if (!to.meta.requiresAuth) {
    return
  }

  // Server-side: Quick cookie check for SSR
  if (import.meta.server) {
    const sessionCookie = useCookie('better-auth.session_token')
    
    if (!sessionCookie.value) {
      return navigateTo({
        path: '/auth/login',
        query: { redirect: to.fullPath }
      })
    }
    
    // Cookie exists, allow SSR to proceed
    // Full validation will happen on client-side
    return
  }

  // Client-side: Full session validation with Better-Auth
  if (import.meta.client) {
    const { useAuthClient } = await import('~/lib/auth-client')
    const authClient = useAuthClient()
    
    try {
      const session = await authClient.getSession()
      
      // If no valid session, redirect to login
      if (!session?.data?.user) {
        return navigateTo({
          path: '/auth/login',
          query: { redirect: to.fullPath }
        })
      }
      
      // Session is valid, allow access
    } catch (error) {
      console.error('[Auth Middleware] Error checking session:', error)
      // On error, redirect to login for safety
      return navigateTo({
        path: '/auth/login',
        query: { redirect: to.fullPath }
      })
    }
  }
})
