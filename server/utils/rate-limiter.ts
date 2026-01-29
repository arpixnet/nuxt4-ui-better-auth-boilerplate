/**
 * Redis-Based Rate Limiter with In-Memory Fallback
 *
 * Production-ready rate limiting solution:
 * - Primary: Redis for distributed systems
 * - Fallback: In-memory for development or when Redis is unavailable
 * - Supports Redis with or without password
 *
 * Environment Variables:
 * - REDIS_HOST: Redis server host (default: localhost)
 * - REDIS_PORT: Redis server port (default: 6379)
 * - REDIS_PASSWORD: Optional Redis password
 */

import Redis from 'ioredis'
import { rateLimitLogger, logError } from './logger'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Redis client (singleton)
let redisClient: Redis | null = null
let useRedis = false

// In-memory fallback store
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Initialize Redis connection
 */
function initializeRedis(): Redis | null {
  if (redisClient !== null) {
    return redisClient
  }

  try {
    const redisConfig: any = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          rateLimitLogger.warn('Redis connection failed after 3 retries, falling back to in-memory')
          return null // Stop retrying
        }
        return Math.min(times * 100, 2000) // Exponential backoff
      },
    }

    // Add password if provided
    if (process.env.REDIS_PASSWORD) {
      redisConfig.password = process.env.REDIS_PASSWORD
    }

    redisClient = new Redis(redisConfig)

    redisClient.on('connect', () => {
      rateLimitLogger.info('Connected to Redis')
      useRedis = true
    })

    redisClient.on('error', (err) => {
      logError(rateLimitLogger, err, 'Redis error occurred')
      useRedis = false
    })

    redisClient.on('close', () => {
      rateLimitLogger.warn('Redis connection closed, using in-memory fallback')
      useRedis = false
    })

    return redisClient
  } catch (error) {
    logError(rateLimitLogger, error, 'Failed to initialize Redis')
    return null
  }
}

// Initialize Redis on module load
initializeRedis()

// Cleanup old entries from in-memory store every 5 minutes
setInterval(() => {
  if (!useRedis) {
    const now = Date.now()
    let cleanedCount = 0
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key)
        cleanedCount++
      }
    }
    if (cleanedCount > 0) {
      rateLimitLogger.debug({ cleanedCount }, 'Cleaned up expired in-memory rate limit entries')
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number

  /**
   * Time window in seconds
   */
  windowSeconds: number

  /**
   * Custom identifier (defaults to IP address)
   */
  identifier?: string
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean

  /**
   * Number of requests remaining in the current window
   */
  remaining: number

  /**
   * Timestamp when the rate limit resets (in seconds)
   */
  resetAt: number

  /**
   * Total number of requests allowed in the window
   */
  limit: number
}

/**
 * Check rate limit using Redis
 */
async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!redisClient) {
    throw new Error('Redis client not initialized')
  }

  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const redisKey = `ratelimit:${key}`

  try {
    // Get current count
    const count = await redisClient.incr(redisKey)

    // Set expiration on first request
    if (count === 1) {
      await redisClient.pexpire(redisKey, windowMs)
    }

    // Get TTL to calculate resetAt
    const ttl = await redisClient.pttl(redisKey)
    const resetAt = ttl > 0 ? Math.floor((now + ttl) / 1000) : Math.floor((now + windowMs) / 1000)

    const allowed = count <= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - count)

    // Log when rate limit is approaching (80% used)
    if (remaining === Math.ceil(config.maxRequests * 0.2)) {
      rateLimitLogger.debug({
        key,
        count,
        maxRequests: config.maxRequests,
        remaining,
      }, 'Rate limit threshold approaching')
    }

    return {
      allowed,
      remaining,
      resetAt,
      limit: config.maxRequests
    }
  } catch (error) {
    logError(rateLimitLogger, error, 'Redis operation failed', { key })
    throw error
  }
}

/**
 * Check rate limit using in-memory store (fallback)
 */
function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000

  // Get or create entry
  let entry = rateLimitStore.get(key)

  // If entry doesn't exist or has expired, create new one
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs
    }
    rateLimitStore.set(key, entry)
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  const allowed = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)

  return Promise.resolve({
    allowed,
    remaining,
    resetAt: Math.floor(entry.resetAt / 1000),
    limit: config.maxRequests
  })
}

/**
 * Check if a request should be rate limited
 *
 * Automatically uses Redis if available, falls back to in-memory storage
 *
 * @param event - H3 event object
 * @param config - Rate limit configuration
 * @returns Rate limit result
 *
 * @example
 * ```typescript
 * const result = await checkRateLimit(event, {
 *   maxRequests: 3,
 *   windowSeconds: 3600, // 1 hour
 * })
 *
 * if (!result.allowed) {
 *   throw createError({
 *     statusCode: 429,
 *     message: 'Too many requests. Please try again later.'
 *   })
 * }
 * ```
 */
export async function checkRateLimit(
  event: any,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Get identifier (custom or IP address)
  const identifier = config.identifier || getRequestIP(event) || 'unknown'
  const key = identifier

  // Use Redis if available, otherwise fallback to in-memory
  if (useRedis && redisClient) {
    try {
      return await checkRateLimitRedis(key, config)
    } catch (error) {
      rateLimitLogger.warn({ key, error }, 'Redis failed, falling back to in-memory')
      useRedis = false
      return await checkRateLimitMemory(key, config)
    }
  } else {
    return await checkRateLimitMemory(key, config)
  }
}

/**
 * Get request IP address from event
 */
function getRequestIP(event: any): string | null {
  // Try to get IP from various headers (for proxies/load balancers)
  const headers = event.node.req.headers

  const forwardedFor = headers['x-forwarded-for']
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
    return ips.split(',')[0].trim()
  }

  const realIp = headers['x-real-ip']
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp
  }

  // Fallback to socket address
  return event.node.req.socket.remoteAddress || null
}

/**
 * Helper to throw rate limit error
 */
export function throwRateLimitError(result: RateLimitResult): never {
  const resetDate = new Date(result.resetAt * 1000)
  const resetIn = Math.ceil((result.resetAt * 1000 - Date.now()) / 1000 / 60) // minutes

  rateLimitLogger.warn({
    limit: result.limit,
    remaining: result.remaining,
    resetAt: result.resetAt,
    resetDate: resetDate.toISOString(),
  }, 'Rate limit exceeded')

  throw createError({
    statusCode: 429,
    statusMessage: 'Too Many Requests',
    message: `Rate limit exceeded. Please try again in ${resetIn} minute${resetIn !== 1 ? 's' : ''}.`,
    data: {
      limit: result.limit,
      remaining: result.remaining,
      resetAt: result.resetAt,
      resetDate: resetDate.toISOString()
    }
  })
}
