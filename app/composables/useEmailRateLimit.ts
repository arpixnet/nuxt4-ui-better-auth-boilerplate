/**
 * Email Verification Rate Limiting
 * 
 * Limits email verification requests to prevent abuse.
 * Allows up to 3 requests per hour per email address.
 */

const RATE_LIMIT_MAX_REQUESTS = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

interface RateLimitState {
  email: string
  requests: number
  lastRequestTime: number
  windowStartTime: number
}

const rateLimitState = ref<RateLimitState | null>(null)

/**
 * Check if an email verification request is allowed
 * @param email - Email address to check rate limit for
 * @returns Object with allowed status and remaining requests count
 */
export function useEmailRateLimit() {
  const checkRateLimit = (email: string): { allowed: boolean; remaining: number } => {
    const now = Date.now()
    const normalizedEmail = email.toLowerCase()

    // Reset state if email changed or window expired
    if (
      !rateLimitState.value ||
      rateLimitState.value.email !== normalizedEmail ||
      now - rateLimitState.value.windowStartTime > RATE_LIMIT_WINDOW_MS
    ) {
      rateLimitState.value = {
        email: normalizedEmail,
        requests: 0,
        lastRequestTime: 0,
        windowStartTime: now,
      }
    }

    // Check if within rate limit
    const state = rateLimitState.value
    if (state.requests >= RATE_LIMIT_MAX_REQUESTS) {
      return {
        allowed: false,
        remaining: 0,
      }
    }

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - state.requests,
    }
  }

  const recordRequest = (email: string): void => {
    const normalizedEmail = email.toLowerCase()
    const now = Date.now()

    // Initialize state if needed
    if (
      !rateLimitState.value ||
      rateLimitState.value.email !== normalizedEmail ||
      now - rateLimitState.value.windowStartTime > RATE_LIMIT_WINDOW_MS
    ) {
      rateLimitState.value = {
        email: normalizedEmail,
        requests: 0,
        lastRequestTime: 0,
        windowStartTime: now,
      }
    }

    // Increment request count
    rateLimitState.value.requests++
    rateLimitState.value.lastRequestTime = now
  }

  const resetRateLimit = (): void => {
    rateLimitState.value = null
  }

  return {
    checkRateLimit,
    recordRequest,
    resetRateLimit,
  }
}
