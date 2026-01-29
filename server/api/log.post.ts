/**
 * Client Log Endpoint
 *
 * Receives log messages from the client side.
 * This endpoint should only be used for CRITICAL logs from the frontend.
 *
 * Security note: Rate limiting should be considered for production use.
 */

import { logClientEvent, sessionLogger } from '../utils/logger'
import { checkRateLimit } from '../utils/rate-limiter'

interface ClientLogBody {
  level: 'error' | 'warn' | 'info' | 'debug'
  context: string
  message: string
  data?: Record<string, unknown>
  userId?: string
  sessionId?: string
}

export default defineEventHandler(async (event) => {
  // Rate limiting: 100 logs per minute per client
  const rateLimitResult = await checkRateLimit(event, {
    maxRequests: 100,
    windowSeconds: 60,
    identifier: `client-log:${getRequestHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress || 'unknown'}`
  })

  if (!rateLimitResult.allowed) {
    sessionLogger.warn('Client log rate limit exceeded')
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'Too many log requests. Please slow down.'
    })
  }

  try {
    const body = await readBody<ClientLogBody>(event)
    const { level, context, message, data, userId, sessionId } = body

    // Validate required fields
    if (!level || !context || !message) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Missing required fields: level, context, message'
      })
    }

    // Validate level
    const validLevels = ['error', 'warn', 'info', 'debug']
    if (!validLevels.includes(level)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: `Invalid level. Must be one of: ${validLevels.join(', ')}`
      })
    }

    // Gather client information
    const clientInfo = {
      userAgent: getRequestHeader(event, 'user-agent'),
      ip: getRequestHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress,
      referer: getRequestHeader(event, 'referer'),
      userId,
      sessionId,
    }

    // Log the client event
    logClientEvent(level, context, message, data, clientInfo)

    // Return success
    return {
      success: true,
      logged: true
    }
  } catch (error: any) {
    // Don't log errors from the log endpoint itself to prevent infinite loops
    if (error.statusCode) {
      throw error
    }

    return {
      success: false,
      logged: false
    }
  }
})
