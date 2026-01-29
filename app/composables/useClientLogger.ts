/**
 * Client Logger Composable
 *
 * Provides logging functionality for the client side.
 * - Logs to console in development
 * - Sends critical logs to server in production
 *
 * Usage:
 * const clientLogger = useClientLogger()
 * clientLogger.error('auth-client', 'Authentication failed', { error: err })
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface ClientLoggerOptions {
  /** Minimum level to send to server (default: 'error') */
  serverMinLevel?: LogLevel
  /** Whether to include user info in logs (default: true) */
  includeUserInfo?: boolean
}

/**
 * Client Logger Composable
 *
 * Provides a unified logging interface for the client side.
 * In development, logs are printed to console with prefixes.
 * In production, only critical logs (error, warn) are sent to the server.
 */
export const useClientLogger = (options: ClientLoggerOptions = {}) => {
  const {
    serverMinLevel = 'error',
    includeUserInfo = true,
  } = options

  const config = useRuntimeConfig()
  const isDev = process.env.NODE_ENV === 'development'

  // Get user session info if available
  const getUserInfo = () => {
    if (!includeUserInfo) return {}

    // Try to get session from localStorage (if available)
    let userId: string | undefined
    let sessionId: string | undefined

    if (import.meta.client) {
      try {
        const sessionData = localStorage.getItem('better-auth.session_token')
        if (sessionData) {
          // Parse basic info if available
          const parsed = JSON.parse(sessionData)
          sessionId = parsed?.sessionId
        }
      } catch {
        // Ignore parsing errors
      }
    }

    return { userId, sessionId }
  }

  /**
   * Levels and their priority for server logging
   */
  const levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  /**
   * Check if a log level should be sent to server
   */
  const shouldSendToServer = (level: LogLevel): boolean => {
    return levelPriority[level] >= levelPriority[serverMinLevel]
  }

  /**
   * Format log prefix
   */
  const formatPrefix = (context: string, emoji: string): string => {
    return `[${context}] ${emoji}`
  }

  /**
   * Send log to server
   */
  const sendToServer = async (
    level: LogLevel,
    context: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<void> => {
    if (import.meta.server) return // Only run on client

    try {
      const userInfo = getUserInfo()

      await $fetch('/api/log', {
        method: 'POST',
        body: {
          level,
          context,
          message,
          data,
          ...userInfo,
        },
      })
    } catch {
      // Silently fail if server logging fails
      // We don't want to cause infinite loops of errors
    }
  }

  /**
   * Log a debug message
   * Only logs to console, never sent to server
   */
  const debug = (context: string, message: string, data?: Record<string, unknown>) => {
    if (isDev) {
      console.log(formatPrefix(context, '🔍'), message, data || '')
    }
  }

  /**
   * Log an info message
   * Only logs to console in development
   */
  const info = (context: string, message: string, data?: Record<string, unknown>) => {
    if (isDev) {
      console.log(formatPrefix(context, 'ℹ️'), message, data || '')
    }
  }

  /**
   * Log a warning message
   * Sent to server in production
   */
  const warn = (context: string, message: string, data?: Record<string, unknown>) => {
    if (isDev) {
      console.warn(formatPrefix(context, '⚠️'), message, data || '')
    } else if (shouldSendToServer('warn')) {
      sendToServer('warn', context, message, data)
    }
  }

  /**
   * Log an error message
   * Always sent to server in production
   */
  const error = (context: string, message: string, error?: unknown | Error, data?: Record<string, unknown>) => {
    const errorData = {
      ...data,
      error: error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: isDev ? error.stack : undefined,
          }
        : error,
    }

    if (isDev) {
      console.error(formatPrefix(context, '❌'), message, errorData)
    } else {
      sendToServer('error', context, message, errorData)
    }
  }

  /**
   * Log a security-related event
   * These are always sent to server regardless of environment
   */
  const security = (event: string, data?: Record<string, unknown>) => {
    const message = `Security event: ${event}`

    if (isDev) {
      console.warn(formatPrefix('security', '🔒'), message, data || '')
    }

    // Always send security events to server
    sendToServer('warn', 'security', message, { event, ...data })
  }

  return {
    debug,
    info,
    warn,
    error,
    security,
  }
}

/**
 * Type for the logger instance
 */
export type ClientLogger = ReturnType<typeof useClientLogger>
