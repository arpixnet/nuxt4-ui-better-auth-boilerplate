import { createAuthClient } from "better-auth/vue"
import { jwtClient } from "better-auth/client/plugins"

const config = useRuntimeConfig()

/**
 * Better-Auth Client Configuration
 * 
 * This is the client-side authentication client that communicates
 * with the Better-Auth server endpoints.
 * 
 * It includes the JWT plugin to enable JWT token retrieval.
 */
export const authClient = createAuthClient({
    baseURL: config.public.betterAuth.url,
    plugins: [
        jwtClient(),
    ],
})

/**
 * Type definitions for Better-Auth client
 */
export type AuthClient = typeof authClient;
