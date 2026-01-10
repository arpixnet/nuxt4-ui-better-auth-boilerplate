/**
 * Send Reset Password Email
 * 
 * Sends a password reset email to a user who requested to reset their password.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userEmail, userName, resetLink, loginUrl, ipAddress } = body

  console.log('[Send-Reset-Password] Preparing to send reset password email...')
  console.log('[Send-Reset-Password] Recipient:', userEmail)
  console.log('[Send-Reset-Password] User name:', userName)

  // Validate required fields
  if (!userEmail || !userName || !resetLink) {
    console.error('[Send-Reset-Password] ❌ Missing required fields')
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: userEmail, userName, resetLink'
    })
  }

  const sender = useMailSender()
  const config = event.context.runtimeConfig || useRuntimeConfig()
  const appName = config?.public?.appName || 'Your App'
  
  console.log('[Send-Reset-Password] Template: reset-password')
  console.log('[Send-Reset-Password] App Name:', appName)
  console.log('[Send-Reset-Password] Reset link:', resetLink)
  console.log('[Send-Reset-Password] Login URL:', loginUrl)
  console.log('[Send-Reset-Password] IP Address:', ipAddress || 'Unknown')
  
  try {
    const info = await sender.send({
      to: userEmail,
      subject: 'Reset Your Password',
      template: 'reset-password',
      context: {
        userName,
        userEmail,
        resetLink,
        loginUrl,
        appName,
        currentYear: new Date().getFullYear(),
        requestDate: new Date().toLocaleString(),
        ipAddress: ipAddress || 'Unknown',
        supportUrl: `${config.public.betterAuth.url}/support`,
      },
    })

    console.log('[Send-Reset-Password] ✅ Reset password email sent successfully')
    console.log('[Send-Reset-Password] Message ID:', info.messageId)
    console.log('[Send-Reset-Password] Full response:', JSON.stringify(info, null, 2))

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    console.error('[Send-Reset-Password] ❌ Failed to send reset password email')
    console.error('[Send-Reset-Password] Error details:', error)
    if (error instanceof Error) {
      console.error('[Send-Reset-Password] Error message:', error.message)
      console.error('[Send-Reset-Password] Error stack:', error.stack)
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send reset password email',
    })
  }
})