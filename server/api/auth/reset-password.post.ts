import { auth } from "../../lib/auth"

/**
 * Reset Password Endpoint
 *
 * Handles password reset using a token from the reset email.
 * This endpoint uses Better-Auth's built-in API to:
 * 1. Validate the reset token
 * 2. Update the user's password
 * 3. Invalidate the reset token
 *
 * Security features:
 * - Token validation by Better-Auth
 * - Password strength validation
 * - Token is single-use (invalidated after use)
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token, newPassword } = body

  console.log('[Reset-Password] Password reset request received')

  // Validate inputs
  if (!token) {
    console.error('[Reset-Password] ❌ Token is required')
    throw createError({
      statusCode: 400,
      statusMessage: 'Token is required'
    })
  }

  if (!newPassword || newPassword.length < 8) {
    console.error('[Reset-Password] ❌ Invalid password')
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 8 characters'
    })
  }

  try {
    // Use Better-Auth's built-in API to reset password
    // This will:
    // 1. Validate the token
    // 2. Check if token is expired
    // 3. Update the user's password
    // 4. Invalidate the token (single-use)
    await auth.api.resetPassword({
      body: {
        token,
        newPassword,
      },
    })

    console.log('[Reset-Password] ✅ Password reset successfully')

    return {
      success: true,
      message: 'Password has been reset successfully'
    }
  } catch (error: any) {
    console.error('[Reset-Password] ❌ Error resetting password')
    console.error('[Reset-Password] Error details:', error)

    // Provide user-friendly error messages
    let errorMessage = 'Failed to reset password'

    if (error.message?.includes('token') || error.message?.includes('expired')) {
      errorMessage = 'Invalid or expired reset token. Please request a new password reset.'
    } else if (error.message?.includes('password')) {
      errorMessage = 'Invalid password. Please ensure it meets the requirements.'
    }

    throw createError({
      statusCode: 400,
      statusMessage: errorMessage
    })
  }
})