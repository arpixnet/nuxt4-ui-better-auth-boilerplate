/**
 * Resend Verification Email
 * 
 * Allows logged-in users to request a new verification email
 * if they didn't receive the first one.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  console.log('[Resend-Verification] Request to resend verification email')
  console.log('[Resend-Verification] Email:', email)

  // Validate email
  if (!email) {
    console.error('[Resend-Verification] ❌ Email is required')
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required'
    })
  }

  const verificationLink = `${process.env.BETTER_AUTH_URL}/verify-email?token=${Date.now()}`
  const loginUrl = `${process.env.BETTER_AUTH_URL}/auth/login`
  const userName = email.split('@')[0]

  console.log('[Resend-Verification] Generated verification link:', verificationLink)
  console.log('[Resend-Verification] Login URL:', loginUrl)
  console.log('[Resend-Verification] User name:', userName)
  
  try {
    console.log('[Resend-Verification] Calling internal email sending endpoint...')
    // Call internal email sending endpoint directly
    const response = await fetch(`${process.env.BETTER_AUTH_URL}/api/email/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: email,
        userName: userName,
        verificationLink: verificationLink,
        loginUrl: loginUrl,
      }),
    })

    console.log('[Resend-Verification] Email sending response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Resend-Verification] ❌ Failed to send verification email')
      console.error('[Resend-Verification] Status:', response.status)
      console.error('[Resend-Verification] Error:', errorText)
      throw new Error('Failed to send verification email')
    }

    console.log('[Resend-Verification] ✅ Verification email sent successfully')
    return { success: true, message: 'Verification email sent successfully' }
  } catch (error: any) {
    console.error('[Resend-Verification] ❌ Error during resend process')
    console.error('[Resend-Verification] Error details:', error)
    if (error instanceof Error) {
      console.error('[Resend-Verification] Error message:', error.message)
      console.error('[Resend-Verification] Error stack:', error.stack)
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send verification email',
    })
  }
})