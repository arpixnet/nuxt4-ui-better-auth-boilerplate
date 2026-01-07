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
  
  // useLazyAsyncData ejecuta la función en el cliente y cachea el resultado
  // Key 'auth-session' asegura que se use el mismo cache en toda la app
  const { data: session, pending, error, refresh } = useLazyAsyncData(
    'auth-session',
    () => authClient.getSession()
  )
  
  return {
    session,
    pending,
    error,
    refresh,
  }
}
