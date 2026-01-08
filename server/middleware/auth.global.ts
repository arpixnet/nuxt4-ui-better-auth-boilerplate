import { getRequestURL, sendRedirect, getCookie } from 'h3'

/**
 * Global Authentication Middleware
 * 
 * This middleware prevents authenticated users from accessing
 * authentication pages (login, register, etc.)
 * 
 * - If user is authenticated and tries to access /auth/* → Redirect to home
 * - If user is not authenticated → Allow access to any page
 * - API routes are not affected by this middleware
 */
export default defineEventHandler(async (event) => {
  // Skip middleware for API routes
  if (event.path.startsWith('/api/')) {
    return
  }

  // Get current request URL
  const url = getRequestURL(event)
  const path = url.pathname

  // Check if this is an auth route
  const isAuthRoute = path.startsWith('/auth/')

  // Only process if it's an auth route
  if (!isAuthRoute) {
    return
  }

  // Check if user has a valid session by looking for the session cookie
  // Better-Auth uses cookies to store session tokens
  const sessionCookie = getCookie(event, 'better-auth.session_token')
  
  // If session cookie exists, user is authenticated - redirect to home
  if (sessionCookie) {
    return sendRedirect(event, '/', 302)
  }
  
  // No session cookie found - allow access to auth pages
  return
})
