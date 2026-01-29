import { getRequestURL } from 'h3'
import { middlewareLogger } from '../utils/logger'

/**
 * Global server middleware to block registration routes when ALLOW_REGISTRATION is false
 *
 * This middleware intercepts all requests to Better-Auth endpoints
 * and blocks sign-up related operations (both email/password and OAuth).
 */
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const registrationAllowed = process.env.ALLOW_REGISTRATION !== "false"

  // If registration is allowed, let all requests through
  if (registrationAllowed) {
    return
  }

  // Paths that are related to registration
  const registrationPaths = [
    '/api/auth/sign-up',
    '/api/auth/sign-up/email',
    '/api/auth/sign-in/social',
  ]

  // Check if the request path contains registration-related paths
  const isRegistrationPath = registrationPaths.some(path => url.pathname.includes(path))

  if (isRegistrationPath) {
    middlewareLogger.warn({
      path: url.pathname,
      registrationAllowed: false,
    }, 'Registration attempt blocked: registration is disabled')

    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Registration is currently disabled'
    })
  }
})
