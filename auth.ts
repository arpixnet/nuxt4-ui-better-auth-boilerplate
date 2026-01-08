import { auth } from "./server/lib/auth"

/**
 * Better-Auth Configuration File
 * 
 * This file exports Better-Auth instance for CLI tools
 * to use for migrations and other operations.
 * 
 * Uses auth.ts which now uses process.env directly,
 * making it compatible with both Nuxt runtime and CLI tools.
 */
export { auth }
