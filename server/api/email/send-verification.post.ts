/**
 * Send Verification Email (Resend)
 * 
 * Sends a verification email to a user who requested to resend
 * their verification link.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userEmail, userName, verificationLink, loginUrl } = body

  // Validate required fields
  if (!userEmail || !userName || !verificationLink) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: userEmail, userName, verificationLink'
    })
  }

  const sender = useMailSender()
  const config = event.context.runtimeConfig || useRuntimeConfig()
  const appName = config?.public?.appName || 'Your App'
  
  console.log('[Send-Verification] Preparing to send verification email...')
  console.log('[Send-Verification] Recipient:', userEmail)
  console.log('[Send-Verification] Template: verify-again')
  console.log('[Send-Verification] Verification link:', verificationLink)
  console.log('[Send-Verification] Login URL:', loginUrl)
  console.log('[Send-Verification] App Name:', appName)
  
  try {
    const info = await sender.send({
      to: userEmail,
      subject: 'Verify Your Email Address',
      template: 'verify-again',
      context: {
        userName,
        userEmail,
        verificationLink,
        loginUrl,
        appName,
        currentYear: new Date().getFullYear(),
        requestDate: new Date().toLocaleString(),
      },
    })

    console.log('[Send-Verification] ✅ Verification email sent successfully')
    console.log('[Send-Verification] Message ID:', info.messageId)
    console.log('[Send-Verification] Full response:', JSON.stringify(info, null, 2))

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    console.error('[Send-Verification] ❌ Failed to send verification email')
    console.error('[Send-Verification] Error details:', error)
    if (error instanceof Error) {
      console.error('[Send-Verification] Error message:', error.message)
      console.error('[Send-Verification] Error stack:', error.stack)
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send verification email',
    })
  }
})