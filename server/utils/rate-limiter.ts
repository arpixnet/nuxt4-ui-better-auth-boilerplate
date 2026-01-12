/**
 * Simple In-Memory Rate Limiter
 * 
 * For production, consider using Redis-based rate limiting for:
 * - Distributed systems
 * - Persistence across restarts
 * - Better performance at scale
 * 
 * This implementation is suitable for:
 * - Development
 * - Single-server deployments
 * - Low to medium traffic
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Store rate limit data in memory
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
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
 * Check if a request should be rate limited
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
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  
  // Get identifier (custom or IP address)
  const identifier = config.identifier || getRequestIP(event) || 'unknown'
  const key = `ratelimit:${identifier}`
  
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
  
  return {
    allowed,
    remaining,
    resetAt: Math.floor(entry.resetAt / 1000),
    limit: config.maxRequests
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

