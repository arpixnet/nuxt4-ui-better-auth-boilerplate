/**
 * Pino Logger Configuration
 *
 * Centralized logging configuration using pino.
 * Provides specialized loggers for different contexts.
 *
 * Usage:
 *   import { authLogger, emailLogger } from '~/server/utils/logger'
 *   authLogger.info({ email }, 'User signed in')
 *   emailLogger.error({ error }, 'Failed to send email')
 */

import pino from 'pino'
import type { Logger } from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Base configuration for all loggers
 */
const baseConfig = {
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
}

/**
 * Transport configuration for pretty printing in development
 */
const transportConfig = isDev ? {
  target: 'pino-pretty',
  options: {
    translateTime: 'yyyy-mm-dd HH:MM:ss',
    ignore: 'pid,hostname',
    colorize: true,
    singleLine: false,
    messageFormat: '[{context}] {msg}',
  }
} : undefined

/**
 * Main logger instance
 */
export const logger: Logger = pino({
  ...baseConfig,
  transport: transportConfig,
})

/**
 * Specialized loggers with predefined context
 * These provide automatic context tagging for easier log filtering
 */

export const authLogger = logger.child({ context: 'auth' })
export const emailLogger = logger.child({ context: 'email' })
export const rateLimitLogger = logger.child({ context: 'rate-limit' })
export const dbLogger = logger.child({ context: 'database' })
export const sessionLogger = logger.child({ context: 'session' })
export const apiLogger = logger.child({ context: 'api' })
export const middlewareLogger = logger.child({ context: 'middleware' })

/**
 * Helper function to create a logger with custom context
 *
 * @param context - The context name for this logger
 * @returns A pino logger instance with the specified context
 *
 * @example
 * const myLogger = createLogger('my-feature')
 * myLogger.info('Something happened')
 */
export function createLogger(context: string): Logger {
  return logger.child({ context })
}

/**
 * Helper to log errors with consistent format
 *
 * @param logger - The logger instance to use
 * @param error - The error to log
 * @param message - Additional context message
 * @param data - Additional data to include in the log
 */
export function logError(
  logger: Logger,
  error: unknown,
  message: string,
  data?: Record<string, unknown>
): void {
  const errorData = {
    ...data,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: isDev ? error.stack : undefined,
    } : error,
  }

  logger.error(errorData, message)
}

/**
 * Helper to log client-side errors received from the frontend
 *
 * @param level - Log level (error, warn, info)
 * @param context - Context from client
 * @param message - Log message
 * @param data - Additional data
 * @param clientInfo - Client information (userAgent, ip, etc)
 */
export function logClientEvent(
  level: string,
  context: string,
  message: string,
  data?: Record<string, unknown>,
  clientInfo?: Record<string, unknown>
): void {
  const loggerInstance = logger.child({ context: `client:${context}` })
  const logData = {
    ...data,
    client: clientInfo,
  }

  switch (level) {
    case 'error':
      loggerInstance.error(logData, message)
      break
    case 'warn':
      loggerInstance.warn(logData, message)
      break
    case 'info':
      loggerInstance.info(logData, message)
      break
    case 'debug':
      loggerInstance.debug(logData, message)
      break
    default:
      loggerInstance.info(logData, message)
  }
}
