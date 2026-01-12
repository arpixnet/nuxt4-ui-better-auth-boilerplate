/**
 * Send Welcome Email
 * 
 * Sends a welcome email to a newly registered user.
 * Note: The welcome email is sent AFTER Better-Auth has already sent the verification email.
 * If email verification is required, Better-Auth handles the verification email separately.
 * The welcome email is complementary and does NOT include the verification link.
 * Users can request a new verification email from /verify-email page if needed.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userEmail, userName, loginUrl } = body

  console.log('[Send-Welcome] Preparing to send welcome email...')
  console.log('[Send-Welcome] Recipient:', userEmail)
  console.log('[Send-Welcome] User name:', userName)

  // Validate required fields
  if (!userEmail || !userName) {
    console.error('[Send-Welcome] ❌ Missing required fields')
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: userEmail, userName'
    })
  }

  const sender = useMailSender()
  const config = event.context.runtimeConfig || useRuntimeConfig()
  
  // Check if email verification is required
  const requiresVerification = config.public.betterAuth.emailVerification
  const appName = config?.public?.appName || 'Your App'
  
  console.log('[Send-Welcome] Template: welcome')
  console.log('[Send-Welcome] App Name:', appName)
  console.log('[Send-Welcome] Email verification required:', requiresVerification)
  console.log('[Send-Welcome] Login URL:', loginUrl)
  
  try {
    const info = await sender.send({
      to: userEmail,
      subject: `Welcome to ${appName}!`,
      template: 'welcome',
      context: {
        userName,
        userEmail,
        loginUrl,
        appName,
        requiresVerification,
        currentYear: new Date().getFullYear(),
        unsubscribeUrl: `${config.public.betterAuth.url}/unsubscribe?email=${userEmail}`,
      },
    })

    console.log('[Send-Welcome] ✅ Welcome email sent successfully')
    console.log('[Send-Welcome] Message ID:', info.messageId)
    console.log('[Send-Welcome] Full response:', JSON.stringify(info, null, 2))

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    console.error('[Send-Welcome] ❌ Failed to send welcome email')
    console.error('[Send-Welcome] Error details:', error)
    if (error instanceof Error) {
      console.error('[Send-Welcome] Error message:', error.message)
      console.error('[Send-Welcome] Error stack:', error.stack)
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send welcome email',
    })
  }
})
