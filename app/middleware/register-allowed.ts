/**
 * Middleware to protect registration routes
 * 
 * When ALLOW_REGISTRATION is false, this middleware throws a 404 error
 * before the registration page can load.
 * 
 * This prevents users from accessing the registration form and makes
 * the route appear as if it doesn't exist.
 */
export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  
  // Only apply to registration-related routes
  const registerRoutes = ['/auth/register']
  
  if (registerRoutes.includes(to.path)) {
    if (!config.public.allowRegistration) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Registration is currently disabled'
      })
    }
  }
})
