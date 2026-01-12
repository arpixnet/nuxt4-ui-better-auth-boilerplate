import { Pool } from "pg"

/**
 * Resend Verification Email
 *
 * Allows users to request a new verification email if they didn't receive
 * the original one or if it expired.
 *
 * This endpoint:
 * 1. Generates a new verification token using Better-Auth
 * 2. Sends a RE-VERIFICATION email (not welcome email)
 * 3. Uses the verify-again template (no welcome message)
 *
 * Rate Limiting: 3 requests per hour per email address
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  console.log('[Resend-Verification] Request to resend verification email')
  console.log('[Resend-Verification] Email:', email)

  // Validate email
  if (!email) {
    console.error('[Resend-Verification] ❌ Email is required')
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required'
    })
  }

  // Rate limiting: 3 requests per hour per email
  const rateLimitResult = await checkRateLimit(event, {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    identifier: `resend-verification:${email.toLowerCase()}`
  })

  if (!rateLimitResult.allowed) {
    console.warn('[Resend-Verification] ⚠️ Rate limit exceeded for:', email)
    throwRateLimitError(rateLimitResult)
  }

  console.log('[Resend-Verification] Rate limit check passed. Remaining:', rateLimitResult.remaining)

  try {
    // Get user from database to verify they exist
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || "",
    })

    const userResult = await pool.query(
      'SELECT id, email, name, "emailVerified" FROM "user" WHERE email = $1',
      [email]
    )

    if (userResult.rows.length === 0) {
      console.error('[Resend-Verification] ❌ User not found')
      // For security, don't reveal if user exists
      return { success: true, message: 'If an account exists with this email, a verification email has been sent.' }
    }

    const user = userResult.rows[0]

    if (user.emailVerified) {
      console.log('[Resend-Verification] ℹ️ Email already verified')
      // For security, don't reveal if email is already verified
      return { success: true, message: 'If an account exists with this email, a verification email has been sent.' }
    }

    console.log('[Resend-Verification] Generating new verification token...')

    // Generate a new verification token using Better-Auth
    // This will create a token in the verification table
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 3600 * 1000) // 1 hour

    await pool.query(
      'INSERT INTO verification (identifier, value, "expiresAt") VALUES ($1, $2, $3) ON CONFLICT (identifier) DO UPDATE SET value = $2, "expiresAt" = $3',
      [email, token, expiresAt]
    )

    await pool.end()

    const verificationUrl = `${process.env.BETTER_AUTH_URL}/api/verify-email?token=${token}&callbackURL=${encodeURIComponent(process.env.BETTER_AUTH_URL || "http://localhost:3000")}`

    console.log('[Resend-Verification] Sending re-verification email (verify-again template)...')

    // Send RE-VERIFICATION email (not welcome email)
    // This uses the verify-again template which has no welcome message
    const response = await fetch(`${process.env.BETTER_AUTH_URL}/api/email/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: user.email,
        userName: user.name || user.email.split('@')[0],
        verificationLink: verificationUrl,
        loginUrl: `${process.env.BETTER_AUTH_URL}/auth/login`,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Resend-Verification] ❌ Failed to send email. Status:', response.status, 'Error:', errorText)
      throw new Error('Failed to send verification email')
    }

    console.log('[Resend-Verification] ✅ Re-verification email sent successfully')
    return { success: true, message: 'Verification email sent successfully' }
  } catch (error: any) {
    console.error('[Resend-Verification] ❌ Error during resend process')
    console.error('[Resend-Verification] Error details:', error)
    if (error instanceof Error) {
      console.error('[Resend-Verification] Error message:', error.message)
      console.error('[Resend-Verification] Error stack:', error.stack)
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send verification email',
    })
  }
})