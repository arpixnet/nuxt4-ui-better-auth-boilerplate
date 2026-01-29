/**
 * Send Welcome Email
 *
 * Sends a welcome email to a newly registered user.
 * This email is called by Better-Auth hooks and includes the verification link
 * if email verification is enabled.
 *
 * This is the ONLY email sent on registration - it combines welcome + verification.
 */

import { emailLogger, logError } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userEmail, userName, verificationLink, loginUrl } = body

  emailLogger.info({
    email: userEmail,
    userName,
    hasVerificationLink: !!verificationLink,
  }, 'Preparing to send welcome email')

  // Validate required fields
  if (!userEmail || !userName) {
    emailLogger.error('Missing required fields for welcome email')
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

  emailLogger.debug({
    template: 'welcome',
    appName,
    requiresVerification,
  }, 'Welcome email context')

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
        unsubscribeUrl: `${config.public.betterAuth.url}/unsubscribe?email=${encodeURIComponent(userEmail)}`,
      },
    })

    emailLogger.info({
      email: userEmail,
      messageId: info.messageId,
    }, 'Welcome email sent successfully')

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    logError(emailLogger, error, 'Failed to send welcome email', {
      email: userEmail,
      userName,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send welcome email',
    })
  }
})
