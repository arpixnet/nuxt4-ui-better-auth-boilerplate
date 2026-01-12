/**
 * Send Welcome Email
 *
 * Sends a welcome email to a newly registered user.
 * This email is called by Better-Auth hooks and includes the verification link
 * if email verification is enabled.
 *
 * This is the ONLY email sent on registration - it combines welcome + verification.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userEmail, userName, verificationLink, loginUrl } = body

  console.log('[Send-Welcome] Preparing to send welcome email...')
  console.log('[Send-Welcome] Recipient:', userEmail)
  console.log('[Send-Welcome] User name:', userName)
  console.log('[Send-Welcome] Verification link:', verificationLink || 'Not required')

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

  // Check if email verification is required based on whether verificationLink was provided
  const requiresVerification = !!verificationLink
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
        verificationLink: verificationLink || undefined,
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
