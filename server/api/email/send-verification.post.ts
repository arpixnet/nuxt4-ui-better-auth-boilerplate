/**
 * Send Verification Email (Resend)
 *
 * Sends a verification email to a user who requested to resend
 * their verification link.
 */

import { emailLogger, logError } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userEmail, userName, verificationLink, loginUrl } = body

  // Validate required fields
  if (!userEmail || !userName || !verificationLink) {
    emailLogger.error('Missing required fields for verification email')
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: userEmail, userName, verificationLink'
    })
  }

  const sender = useMailSender()
  const config = event.context.runtimeConfig || useRuntimeConfig()
  const appName = config?.public?.appName || 'Your App'

  emailLogger.info({
    email: userEmail,
    userName,
  }, 'Preparing to send verification email (resend)')

  emailLogger.debug({
    template: 'verify-again',
    appName,
  }, 'Verification email context')

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

    emailLogger.info({
      email: userEmail,
      messageId: info.messageId,
    }, 'Verification email sent successfully (resend)')

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    logError(emailLogger, error, 'Failed to send verification email', {
      email: userEmail,
      userName,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send verification email',
    })
  }
})
