import { useAuthClient } from '~/lib/auth-client'

/**
 * Better-Auth Session Types
 */
interface User {
  id: string
  email: string
  name?: string
  emailVerified: boolean
  image?: string
  createdAt: Date
  updatedAt: Date
}

interface Session {
  id: string
  userId: string
  expiresAt: Date
  token: string
  ipAddress?: string
  userAgent?: string
}

interface AuthSessionData {
  user: User
  session: Session
}

interface AuthSession {
  data: AuthSessionData | null
  error: Error | null
}

/**
 * Composable para obtener la sesión del usuario de forma reactiva
 * 
 * Este composable proporciona acceso reactiva a la sesión del usuario,
 * utilizando el cliente de Better-Auth y el sistema de datos de Nuxt.
 * 
 * Características:
 * - Tipado fuerte con TypeScript
 * - Detección automática de sesión expirada
 * - Auto-redirect a login cuando la sesión expira
 * 
 * @returns { session, pending, error, refresh, isExpired }
 *   - session: Datos de la sesión (reactivo)
 *   - pending: Estado de carga (true = cargando)
 *   - error: Error si ocurrió alguno
 *   - refresh: Función para re-cargar la sesión
 *   - isExpired: Computed que indica si la sesión está expirada
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 *   const { session, pending, isExpired } = useAuthSession()
 * </script>
 * 
 * <template>
 *   <div v-if="pending">Loading...</div>
 *   <div v-else-if="isExpired">Session expired. Redirecting...</div>
 *   <div v-else-if="session.data">{{ session.data.user.name }}</div>
 *   <div v-else>No session</div>
 * </template>
 * ```
 */
export const useAuthSession = () => {
  const authClient = useAuthClient()
  const router = useRouter()
  
  // Estado reactiva para la sesión
  const session = ref<AuthSession>({ data: null, error: null })
  const pending = ref(true) // Start with pending = true to prevent showing "No session" initially
  const error = ref<Error | null>(null)
  
  // Computed para verificar si la sesión está expirada
  const isExpired = computed(() => {
    if (!session.value.data?.session) return false
    
    const expiresAt = new Date(session.value.data.session.expiresAt)
    return expiresAt.getTime() < Date.now()
  })
  
  // Función para cargar la sesión
  const loadSession = async () => {
    try {
      pending.value = true
      error.value = null
      
      const sessionData = await authClient.getSession()
      
      // Check if session data is valid
      if (sessionData && sessionData.data) {
        session.value = sessionData as AuthSession
        
        // Check if session is expired
        if (isExpired.value) {
          console.warn('[useAuthSession] Session is expired, redirecting to login')
          session.value = { data: null, error: null }
          router.push('/auth/login')
        }
      } else {
        session.value = { data: null, error: null }
      }
    } catch (err) {
      console.error('[useAuthSession] Error loading session:', err)
      error.value = err as Error
      session.value = { data: null, error: err as Error }
    } finally {
      pending.value = false
    }
  }
  
  // Cargar sesión inicialmente
  onMounted(() => {
    loadSession()
  })
  
  // Watch for expiration
  watch(isExpired, (expired) => {
    if (expired && session.value.data) {
      console.warn('[useAuthSession] Session expired during usage, redirecting to login')
      session.value = { data: null, error: null }
      router.push('/auth/login')
    }
  })
  
  return {
    session,
    pending,
    error,
    refresh: loadSession,
    isExpired,
  }
}
