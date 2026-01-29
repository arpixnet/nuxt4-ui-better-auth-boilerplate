import { useAuthSession } from './useAuthSession'
import { useClientLogger } from './useClientLogger'

/**
 * Session Monitor Composable
 *
 * Automatically monitors session validity and refreshes before expiration.
 * Use this in app.vue or layout to enable global session monitoring.
 *
 * Features:
 * - Checks session validity every 5 minutes
 * - Auto-refreshes session when 80% of lifetime has passed
 * - Auto-redirects to login when session expires
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * // In app.vue or default layout
 * useSessionMonitor()
 * </script>
 * ```
 */
export const useSessionMonitor = () => {
  const { session, refresh, isExpired } = useAuthSession()
  const router = useRouter()
  const logger = useClientLogger({ serverMinLevel: 'warn' })

  let monitorInterval: ReturnType<typeof setInterval> | null = null

  /**
   * Check if session needs refresh
   * Refreshes when 80% of session lifetime has passed
   */
  const checkSessionHealth = async () => {
    if (!session.value.data?.session) return

    const expiresAt = new Date(session.value.data.session.expiresAt).getTime()
    const now = Date.now()
    const sessionLifetime = expiresAt - now

    // If session expired, redirect to login
    if (sessionLifetime <= 0) {
      logger.warn('session-monitor', 'Session expired, redirecting to login')
      stopMonitoring()
      router.push('/auth/login')
      return
    }

    // Refresh session when 80% of lifetime has passed
    // This prevents session from expiring while user is active
    const refreshThreshold = sessionLifetime * 0.2 // 20% remaining

    if (sessionLifetime < refreshThreshold) {
      logger.info('session-monitor', 'Session nearing expiration, refreshing...')
      try {
        await refresh()
        logger.debug('session-monitor', 'Session refreshed successfully')
      } catch (error) {
        logger.error('session-monitor', 'Failed to refresh session', error)
      }
    }
  }

  /**
   * Start monitoring session
   */
  const startMonitoring = () => {
    // Check immediately
    checkSessionHealth()

    // Then check every 5 minutes
    monitorInterval = setInterval(() => {
      checkSessionHealth()
    }, 5 * 60 * 1000) // 5 minutes

    logger.debug('session-monitor', 'Started session monitoring')
  }

  /**
   * Stop monitoring session
   */
  const stopMonitoring = () => {
    if (monitorInterval) {
      clearInterval(monitorInterval)
      monitorInterval = null
      logger.debug('session-monitor', 'Stopped session monitoring')
    }
  }

  // Start monitoring when component mounts
  onMounted(() => {
    if (session.value.data) {
      startMonitoring()
    }
  })

  // Watch for session changes
  watch(() => session.value.data, (newSession) => {
    if (newSession) {
      startMonitoring()
    } else {
      stopMonitoring()
    }
  })

  // Clean up on unmount
  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    startMonitoring,
    stopMonitoring,
  }
}
