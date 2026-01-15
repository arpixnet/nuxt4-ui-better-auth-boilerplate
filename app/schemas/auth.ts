import { z } from 'zod'

/**
 * Zod schemas for authentication forms
 * 
 * These schemas provide type-safe validation for authentication forms
 * with i18n error messages.
 */

/**
 * Get i18n error message helper
 * This function safely retrieves i18n messages for schema validation
 */
function getI18nError(key: string, defaultMessage: string) {
  // Try to get i18n instance, fallback to default message
  try {
    // @ts-ignore - Accessing global i18n if available
    const i18n = globalThis.$nuxt?.$i18n
    if (i18n) {
      return i18n.t(key)
    }
  } catch {
    // Silently fail if i18n is not available
  }
  return defaultMessage
}

/**
 * Schema for login form
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, getI18nError('validation.emailRequired', 'Email is required'))
    .email(getI18nError('validation.emailInvalid', 'Please enter a valid email address')),
  password: z
    .string()
    .min(1, getI18nError('validation.passwordRequired', 'Password is required'))
    .min(8, getI18nError('validation.passwordMinLength', 'Password must be at least 8 characters')),
})

/**
 * Schema for registration form
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, getI18nError('validation.emailRequired', 'Email is required'))
    .email(getI18nError('validation.emailInvalid', 'Please enter a valid email address')),
  password: z
    .string()
    .min(1, getI18nError('validation.passwordRequired', 'Password is required'))
    .min(8, getI18nError('validation.passwordMinLength', 'Password must be at least 8 characters')),
})

/**
 * Type inference from schemas
 */
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
