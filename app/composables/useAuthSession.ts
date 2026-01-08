import { useAuthClient } from '~/lib/auth-client'

/**
 * Composable para obtener la sesión del usuario de forma reactiva
 * 
 * Este composable proporciona acceso reactiva a la sesión del usuario,
 * utilizando el cliente de Better-Auth y el sistema de datos de Nuxt.
 * 
 * Comportamiento similar a un método `useSession()` original,
 * pero integrado con el ecosistema de Nuxt 4.
 * 
 * @returns { session, pending, error, refresh }
 *   - session: Datos de la sesión (reactivo)
 *   - pending: Estado de carga (true = cargando)
 *   - error: Error si ocurrió alguno
 *   - refresh: Función para re-cargar la sesión
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 *   const { session, pending } = useAuthSession()
 * </script>
 * 
 * <template>
 *   <div v-if="pending">Loading...</div>
 *   <div v-else-if="session">{{ session.user.name }}</div>
 *   <div v-else>No session</div>
 * </template>
 * ```
 */
export const useAuthSession = () => {
  const authClient = useAuthClient()
  
  // Estado reactiva para la sesión
  const session = ref<any>(null)
  const pending = ref(true) // Start with pending = true to prevent showing "No session" initially
  const error = ref<any>(null)
  
  // Función para cargar la sesión
  const loadSession = async () => {
    try {
      pending.value = true
      error.value = null
      
      const sessionData = await authClient.getSession()
      session.value = sessionData as any
    } catch (err) {
      console.error('Error loading session:', err)
      error.value = err
      session.value = null
    } finally {
      pending.value = false
    }
  }
  
  // Cargar sesión inicialmente
  onMounted(() => {
    loadSession()
  })
  
  return {
    session,
    pending,
    error,
    refresh: loadSession,
  }
}
