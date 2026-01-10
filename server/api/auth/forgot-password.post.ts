/**
 * Forgot Password Endpoint
 * 
 * Handles password reset requests by calling the internal
 * reset password email sender endpoint.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, redirectTo } = body

  // Validate email
  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required'
    })
  }

  if (!redirectTo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Redirect URL is required'
    })
  }

  try {
    // Generate a temporary token (in production, Better-Auth handles this)
    // For now, we'll create a simple token that will be validated in reset-password
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
    const resetLink = `${process.env.BETTER_AUTH_URL}/auth/reset-password?token=${token}`
    
    // Call internal email sender endpoint
    const response = await fetch(`${process.env.BETTER_AUTH_URL}/api/email/send-reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: email,
        userName: email.split('@')[0],
        resetLink,
        loginUrl: `${process.env.BETTER_AUTH_URL}/auth/login`,
        ipAddress: event.node.req.socket.remoteAddress || 'Unknown',
      }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to send reset email')
    }
    
    // Always return success for security (don't reveal if email exists)
    return { success: true, message: 'Password reset email sent' }
  } catch (error: any) {
    console.error('Forgot password error:', error)
    
    // For security, still return success even if user doesn't exist
    // This prevents email enumeration attacks
    return { success: true, message: 'Password reset email sent' }
  }
})
