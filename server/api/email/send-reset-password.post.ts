/**
 * Send Reset Password Email
 *
 * Sends a password reset email to a user who requested to reset their password.
 */

import { emailLogger, logError } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userEmail, userName, resetLink, loginUrl, ipAddress } = body

  emailLogger.info({
    email: userEmail,
    userName,
    ipAddress,
  }, 'Preparing to send reset password email')

  // Validate required fields
  if (!userEmail || !userName || !resetLink) {
    emailLogger.error('Missing required fields for reset password email')
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: userEmail, userName, resetLink'
    })
  }

  const sender = useMailSender()
  const config = event.context.runtimeConfig || useRuntimeConfig()
  const appName = config?.public?.appName || 'Your App'

  emailLogger.debug({
    template: 'reset-password',
    appName,
    ipAddress,
  }, 'Reset password email context')

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

    emailLogger.info({
      email: userEmail,
      messageId: info.messageId,
    }, 'Reset password email sent successfully')

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    logError(emailLogger, error, 'Failed to send reset password email', {
      email: userEmail,
      userName,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send reset password email',
    })
  }
})
