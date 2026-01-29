import { auth } from "../../lib/auth"
import { checkRateLimit, throwRateLimitError } from "../../utils/rate-limiter"
import { authLogger, logError } from "../../utils/logger"

/**
 * Forgot Password Endpoint
 *
 * Handles password reset requests using Better-Auth's built-in API.
 * This endpoint:
 * 1. Validates the email format
 * 2. Applies rate limiting (3 requests per hour per email)
 * 3. Calls Better-Auth's forgetPassword API
 * 4. Better-Auth generates a secure token and sends the reset email
 *
 * Security features:
 * - Always returns success (prevents email enumeration)
 * - Rate limiting to prevent abuse
 * - Secure token generation by Better-Auth
 *
 * Rate Limiting: 3 requests per hour per email address
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, redirectTo } = body

  authLogger.info({ email }, 'Password reset request received')

  // Validate email
  if (!email) {
    authLogger.error('Email is required for password reset')
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required'
    })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    authLogger.warn({ email }, 'Invalid email format for password reset')
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email format'
    })
  }

  // Rate limiting: 3 requests per hour per email
  const rateLimitResult = await checkRateLimit(event, {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    identifier: `forgot-password:${email.toLowerCase()}`
  })

  if (!rateLimitResult.allowed) {
    authLogger.warn({
      email,
      remaining: rateLimitResult.remaining,
    }, 'Rate limit exceeded for password reset')
    throwRateLimitError(rateLimitResult)
  }

  authLogger.debug({
    email,
    remaining: rateLimitResult.remaining,
  }, 'Rate limit check passed for password reset')

  try {
    // Use Better-Auth's built-in API to request password reset
    // This will:
    // 1. Check if user exists
    // 2. Generate a secure reset token
    // 3. Store the token in the database
    // 4. Call our sendResetPassword hook with the reset URL
    await auth.api.requestPasswordReset({
      body: {
        email: email,
        redirectTo: redirectTo || `${process.env.BETTER_AUTH_URL}/auth/reset-password`,
      }
    })

    authLogger.info({ email }, 'Password reset request processed successfully')

    // Always return success for security (don't reveal if email exists)
    // This prevents email enumeration attacks
    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.'
    }
  } catch (error: any) {
    logError(authLogger, error, 'Error processing password reset', { email })

    // For security, still return success even if user doesn't exist
    // This prevents email enumeration attacks
    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.'
    }
  }
})
