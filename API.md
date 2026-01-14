# API Documentation

## Authentication (Better-Auth)
Base URL: `/api/auth`

The application uses Better-Auth for authentication. Key endpoints include:

- `POST /api/auth/sign-up/email`: Register a new user
- `POST /api/auth/sign-in/email`: Login with email/password
- `POST /api/auth/sign-out`: Logout
- `GET /api/auth/get-session`: Get current session
- `POST /api/auth/forget-password`: Request password reset
- `POST /api/auth/reset-password`: Reset password with token

For full documentation, visit [Better-Auth Docs](https://better-auth.com).

## Custom Endpoints

### Email Service
Internal endpoints used by hooks to send transactional emails. Protected or internal use recommended.

#### `POST /api/email/send-welcome`
Sends a welcome email to a new user.
- **Body**: `{ userEmail: string, userName: string, verificationLink?: string, loginUrl: string }`

#### `POST /api/email/send-verification`
Sends a verification email (e.g. for resend).
- **Body**: `{ userEmail: string, verificationLink: string }`

#### `POST /api/email/send-reset-password`
Sends a password reset email.
- **Body**: `{ userEmail: string, userName: string, resetLink: string, loginUrl: string }`

### Utility

#### `GET /api/verify-email`
Verifies an email token.
- **Query**: `token=<verification_token>`
- **Returns**: Redirects to home or error page.
