🚀 Nuxt 4 + @nuxt/ui + Better-Auth Boilerplate

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.0-00DC82?logo=nuxt.js)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A modern, production-ready boilerplate for building web applications with **Nuxt 4**, **@nuxt/ui**, and **Better-Auth**. This template provides a solid foundation with essential modules, optimized configuration, complete authentication system, and best practices for rapid development.

## 🎯 Key Features

- 🔐 **Complete Authentication**: Email/password, OAuth 2.0 social login (100% dynamic), 2FA, JWT sessions, and password reset
- 🎨 **Modern UI**: Pre-styled components with **@nuxt/ui**, **Tailwind CSS**, and dark/light mode support
- 🌍 **Internationalization**: Multi-language support (Spanish/English) with **@nuxtjs/i18n**
- 📧 **Transactional Emails**: Handlebars templates with Gmail OAuth2 support
- 💾 **Database Ready**: PostgreSQL with migrations and SQLite fallback
- 🧪 **Testing**: Vitest for unit tests, Playwright for E2E
- 📦 **TypeScript**: Strict type safety with optimized configuration
- 🎯 **Rate Limiting**: Email rate limiting with Redis and route middleware
- 📈 **SEO**: Optimized with **@nuxtjs/seo** module
- 🚀 **Production-Ready**: Built with best practices and security in mind

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [Nuxt 4](https://nuxt.com) | Full-stack framework with App Router |
| [@nuxt/ui](https://ui.nuxt.com) | UI component library |
| [Better-Auth](https://better-auth.com) | Complete authentication solution |
| [Tailwind CSS](https://tailwindcss.com) | Utility-first CSS framework |
| [PostgreSQL](https://www.postgresql.org) | Primary database |
| [@nuxtjs/i18n](https://i18n.nuxtjs.org) | Internationalization |
| [nuxt-arpix-email-sender](https://npmjs.com/package/nuxt-arpix-email-sender) | Transactional emails |

---

## 📦 Quick Start

## Quick Start

```bash
# Create a new project
npx nuxi init my-project -t github:arpixnet/nuxt4-ui-better-auth-boilerplate
cd my-project

# Install dependencies
pnpm install

# Copy environment file and configure
cp .env.example .env

# Start development server
pnpm dev
```

## Features

| Category | Features |
|----------|----------|
| **Core** | [Nuxt 4](https://nuxt.com) with App Router, Vue 3 Composition API, TypeScript |
| **UI** | [@nuxt/ui](https://ui.nuxt.com) components, Tailwind CSS, Dark/Light mode |
| **Auth** | [Better-Auth](https://better-auth.com) with email/password, social login, JWT, 2FA |
| **Email** | Transactional emails with Handlebars templates, Gmail OAuth2 support |
| **i18n** | Multi-language support (Spanish/English) with [@nuxtjs/i18n](https://i18n.nuxtjs.org) |
| **Database** | PostgreSQL support with migrations, SQLite fallback |
| **SEO** | [@nuxtjs/seo](https://nuxtseo.com/) for meta tags and sitemaps |
| **Testing** | Vitest for unit tests, Playwright for E2E |

---

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [Internationalization](#internationalization)
- [Components](#components)
- [Middlewares](#middlewares)
- [Composables](#composables)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Development](#development)
- [Production](#production)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Installation

### Method 1: Using nuxi (Recommended)

```bash
npx nuxi init my-project -t github:arpixnet/nuxt4-ui-better-auth-boilerplate
cd my-project
```

### Method 2: Git Clone

```bash
git clone https://github.com/arpixnet/nuxt4-ui-better-auth-boilerplate.git my-project
cd my-project
rm -rf .git
git init
```

### Install Dependencies

Choose your preferred package manager:

```bash
# pnpm (Recommended)
pnpm install

# npm
npm install

# yarn
yarn install
```

### Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration. See [Configuration](#configuration) for details.

---

## Configuration

### Required Environment Variables

```bash
# Application
APP_NAME=Your App Name

# Better-Auth (Generate with: openssl rand -base64 64)
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_EMAIL_VERIFICATION=true

# Database (used by both app and Hasura)
DATABASE_URL=postgres://${DATABASE_USER}:${DATABASE_PASSWORD}@localhost:5432/${DATABASE_NAME}
DATABASE_USER=postgres
DATABASE_PASSWORD=postgrespassword
DATABASE_NAME=whasabi_db

# Hasura
HASURA_ADMIN_SECRET=your-hasura-admin-secret-minimum-32-characters
BETTER_AUTH_WITH_HASURA=true

# Email (see Email Configuration below)
EMAIL_USER=your-email@gmail.com
EMAIL_FROM="Your App <noreply@example.com>"
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
```

### Optional Environment Variables

```bash
# Registration Control
ALLOW_REGISTRATION=true

# Session & JWT
BETTER_AUTH_SESSION_EXPIRES_IN=604800        # 7 days in seconds
BETTER_AUTH_SESSION_UPDATE_AGE=86400         # 1 day in seconds
BETTER_AUTH_COOKIE_MAX_AGE=300               # 5 minutes in seconds
BETTER_AUTH_JWT_EXPIRATION_TIME=7d           # JWT expiration

# Redis (Rate Limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your-redis-password
```

### Email Configuration

The boilerplate uses **nuxt-arpix-email-sender** for transactional emails.

#### Gmail OAuth2 (Recommended for Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Gmail API
3. Create OAuth 2.0 credentials
4. Add your redirect URI (e.g., `http://localhost:3000` for dev)
5. Generate a refresh token using the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

```bash
EMAIL_USER=your-email@gmail.com
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
```

#### Gmail App Password (Development Only)

1. Enable 2-factor authentication
2. Generate an App Password at [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use the 16-character password

```bash
# For App Password, modify nuxt.config.ts to use 'pass' instead of OAuth2
```

### Social Providers

Social login is **100% dynamic** - no code changes needed! Just add environment variables:

```bash
# Convention: SOCIAL_PROVIDER_{PROVIDER}_{FIELD_NAME}
SOCIAL_PROVIDER_GOOGLE_CLIENT_ID=your-client-id
SOCIAL_PROVIDER_GOOGLE_CLIENT_SECRET=your-client-secret

# Any OAuth 2.0 provider works automatically!
SOCIAL_PROVIDER_GITHUB_CLIENT_ID=xxx
SOCIAL_PROVIDER_GITHUB_CLIENT_SECRET=xxx
SOCIAL_PROVIDER_DISCORD_CLIENT_ID=xxx
SOCIAL_PROVIDER_DISCORD_CLIENT_SECRET=xxx
```

See [Better-Auth Documentation](./doc/BETTER_AUTH.md#social-providers-100-dynamic) for more details.

---

## Authentication

This boilerplate includes a complete authentication system powered by **Better-Auth**.

### Features

| Feature | Description |
|---------|-------------|
| Email/Password | Secure credential authentication with hashing |
| Email Verification | Optional email verification for new users |
| Password Reset | Complete forgot password flow |
| Social Login | OAuth 2.0 for multiple providers (100% dynamic) |
| JWT Sessions | Token-based authentication with Hasura support |
| 2FA | Two-factor authentication support |
| Rate Limiting | Email rate limiting with Redis fallback |

### Authentication Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/auth/login` | Email/password and social login |
| Register | `/auth/register` | New user registration |
| Verify Email | `/auth/verify-email` | Email verification status |
| Forgot Password | `/auth/forgot-password` | Password reset request |
| Reset Password | `/auth/reset-password` | Set new password with token |

### Usage Examples

#### Register a New User

```typescript
import { useAuthClient } from '~/lib/auth-client'

const authClient = useAuthClient()

await authClient.signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
  callbackURL: '/',
})
```

#### Login User

```typescript
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123',
  callbackURL: '/dashboard',
})
```

#### Access Session

```typescript
import { useAuthSession } from '~/composables/useAuthSession'

const { session, pending, isExpired } = useAuthSession()

// Access user data
console.log(session.value?.data?.user)

// Check if authenticated
console.log(session.value?.data !== null)
```

### Documentation

For detailed authentication documentation, see:

- [Better-Auth Complete Guide](./doc/BETTER_AUTH.md) - Server configuration, JWT, social providers, database schema
- [Auth Pages Configuration](./doc/AUTH_CONFIG.md) - Customize login/register pages, logos, colors, gradients

---

## Internationalization

The boilerplate includes multi-language support using [@nuxtjs/i18n](https://i18n.nuxtjs.org/).

### Supported Languages

| Code | Language | Flag | File |
|------|----------|------|------|
| `es` | Español | 🇪🇸 | `i18n/locales/es.json` |
| `en` | English | 🇬🇧 | `i18n/locales/en.json` |

### Configuration

The i18n module is configured in `nuxt.config.ts`:

```typescript
i18n: {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  defaultLocale: 'en',
  strategy: 'no_prefix',  // No URL prefix, uses cookie instead
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'i18n_redirected',
    redirectOn: 'root',
  }
}
```

### Adding a New Language

1. Create a new locale file in `i18n/locales/`:

```json
// i18n/locales/fr.json
{
  "welcome": "Bienvenue",
  "login": "Connexion"
}
```

2. Add the locale to `nuxt.config.ts`:

```typescript
i18n: {
  locales: [
    { code: 'es', language: 'es-ES', file: 'es.json', flag: '🇪🇸', name: 'Español' },
    { code: 'en', language: 'en-US', file: 'en.json', flag: '🇬🇧', name: 'English' },
    { code: 'fr', language: 'fr-FR', file: 'fr.json', flag: '🇫🇷', name: 'Français' },
  ],
}
```

### Usage in Components

```vue
<template>
  <h1>{{ $t('welcome') }}</h1>
  <p>{{ $t('auth.login.subtitle') }}</p>
</template>

<script setup>
// Get current locale
const { locale, setLocale } = useI18n()

// Change language
const changeLanguage = (lang: string) => {
  setLocale(lang)
}
</script>
```

For detailed i18n documentation, see [Internationalization Guide](./doc/I18N.md).

---

## Components

The boilerplate includes several reusable components.

### Layout Components

| Component | Location | Description |
|-----------|----------|-------------|
| `AppHeader` | `app/components/layout/AppHeader.vue` | Site header with navigation |
| `AppFooter` | `app/components/layout/AppFooter.vue` | Site footer |
| `AuthUser` | `app/components/layout/AuthUser.vue` | Authenticated user menu |
| `LanguageSelector` | `app/components/layout/languageSelector.vue` | Language switcher dropdown |

### Auth Components

| Component | Location | Description |
|-----------|----------|-------------|
| `AuthAvatar` | `app/components/AuthAvatar.vue` | User avatar with fallback |
| `AuthLogout` | `app/components/AuthLogout.vue` | Logout button |
| `UPassword` | `app/components/UPassword.vue` | Password input with toggle visibility |

### Layouts

| Layout | File | Description |
|--------|------|-------------|
| `default` | `app/layouts/default.vue` | Main layout with header and footer |
| `blank` | `app/layouts/blank.vue` | Minimal layout for auth pages |

For customizing auth page appearance (logos, colors, gradients), see [Auth Pages Configuration](./doc/AUTH_CONFIG.md).

For complete component reference, see [Components Documentation](./doc/COMPONENTS.md).

---

## Middlewares

### Route Middlewares

#### `auth.ts`

Protects routes that require authentication.

```typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  // Redirect to login if not authenticated
})
```

Usage in pages:

```vue
<script setup>
// Run middleware for this page
definePageMeta({
  middleware: 'auth'
})
</script>
```

#### `register-allowed.ts`

Controls access to registration page based on `ALLOW_REGISTRATION` environment variable.

```typescript
// Returns 404 if registration is disabled
definePageMeta({
  middleware: 'register-allowed'
})
```

### Server Middleware

Server-side middleware can be added in `server/middleware/` for global request handling.

For complete middleware documentation, see [Middlewares Guide](./doc/MIDDLEWARES.md).

---

## Composables

### Authentication Composables

#### `useAuthClient` (app/lib/auth-client.ts)

Singleton Better-Auth client instance.

```typescript
const authClient = useAuthClient()

// Available methods
await authClient.signIn.email({ email, password, callbackURL })
await authClient.signIn.social({ provider, callbackURL })
await authClient.signOut()
await authClient.getSession()
await authClient.getJWT()
```

**Important:** Must be called from within a Vue component's `<script setup>`, a Nuxt plugin, or another composable.

#### `useAuthSession` (app/composables/useAuthSession.ts)

Reactive session management with auto-redirect on expiration.

```typescript
const { session, pending, error, refresh, isExpired } = useAuthSession()

// session: Ref<AuthSession> - Session data
// pending: Ref<boolean> - Loading state
// error: Ref<Error | null> - Error if any
// refresh: () => Promise<void> - Reload session
// isExpired: ComputedRef<boolean> - Session expiration status
```

#### `useAuthConfig` (app/composables/useAuthConfig.ts)

Access authentication page configuration (logos, colors, etc.).

```typescript
const { config, getLogo, getDecorativePanel, getGradientStyle } = useAuthConfig()

// Get panel configuration for a page
const panelConfig = getDecorativePanel('login')

// Get gradient styles
const gradientStyle = getGradientStyle('login', 'dark')
```

See [Auth Configuration Documentation](./doc/AUTH_CONFIG.md) for full customization guide.

### Utility Composables

#### `useEmailRateLimit` (app/composables/useEmailRateLimit.ts)

Rate limiting for email operations with Redis fallback.

```typescript
const { isAllowed, checkLimit, resetLimit } = useEmailRateLimit()

// Check if email can be sent
if (await checkLimit('user@example.com')) {
  // Send email
}
```

#### `useSessionMonitor` (app/composables/useSessionMonitor.ts)

Monitors session expiration and handles auto-logout.

```typescript
useSessionMonitor({
  // Auto-redirect to login on expiration
  onExpired: () => router.push('/auth/login')
})
```

For complete composables reference, see [Composables Documentation](./doc/COMPOSABLES.md).

---

## API Endpoints

### Better-Auth Endpoints

All authentication endpoints are under `/api/auth/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up/email` | Register new user |
| POST | `/api/auth/sign-in/email` | Login with email/password |
| POST | `/api/auth/sign-in/social` | Social login |
| POST | `/api/auth/sign-out` | Logout |
| GET | `/api/auth/get-session` | Get current session |
| POST | `/api/auth/forget-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Custom Email Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/send-welcome` | Send welcome email |
| POST | `/api/email/send-verification` | Send verification email |
| POST | `/api/email/send-reset-password` | Send password reset email |

For complete API documentation, see [API Documentation](./doc/API.md).

---

## Project Structure

```
├── app/                          # Nuxt App Directory (Client)
│   ├── app.vue                   # Root Vue component
│   ├── assets/                   # Static assets
│   │   └── css/
│   │       ├── main.css          # Global styles
│   │       └── content.css       # Content module styles
│   ├── components/               # Vue components
│   │   ├── layout/               # Layout components
│   │   │   ├── AppFooter.vue
│   │   │   ├── AppHeader.vue
│   │   │   ├── AuthUser.vue
│   │   │   └── languageSelector.vue
│   │   ├── AuthAvatar.vue
│   │   ├── AuthLogout.vue
│   │   └── UPassword.vue
│   ├── composables/              # Vue composables
│   │   ├── useAuthConfig.ts      # Auth page configuration
│   │   ├── useAuthSession.ts     # Session management
│   │   ├── useEmailRateLimit.ts  # Email rate limiting
│   │   └── useSessionMonitor.ts  # Session expiration monitor
│   ├── config/                   # Configuration files
│   │   └── auth.config.ts        # Auth pages customization
│   ├── layouts/                  # Layout components
│   │   ├── default.vue           # Main layout
│   │   └── blank.vue             # Minimal layout
│   ├── lib/                      # Client utilities
│   │   └── auth-client.ts        # Better-Auth client
│   ├── middleware/               # Route middleware
│   │   ├── auth.ts               # Authentication guard
│   │   └── register-allowed.ts   # Registration control
│   ├── pages/                    # File-based routing
│   │   ├── auth/                 # Auth pages
│   │   │   ├── forgot-password.vue
│   │   │   ├── index.vue
│   │   │   ├── login.vue
│   │   │   ├── register.vue
│   │   │   └── reset-password.vue
│   │   ├── dashboard.vue
│   │   ├── example-content.vue
│   │   ├── index.vue
│   │   └── profile.vue
│   └── schemas/                  # Validation schemas
│       └── auth.ts               # Auth validation schemas
├── server/                       # Server-side code
│   ├── api/                      # API endpoints
│   │   ├── auth/                 # Better-Auth handler
│   │   │   └── [...all].ts
│   │   └── email/                # Email endpoints
│   ├── emails/                   # Email templates
│   │   └── templates/            # Handlebars templates
│   │       ├── reset-password.hbs
│   │       ├── verify-again.hbs
│   │       └── welcome.hbs
│   ├── lib/                      # Server utilities
│   │   └── auth.ts               # Better-Auth configuration
│   └── middleware/               # Server middleware
├── i18n/                         # Internationalization
│   └── locales/                  # Translation files
│       ├── en.json
│       └── es.json
├── public/                       # Static assets
│   ├── favicon.ico
│   └── images/
├── doc/                          # Documentation
│   ├── API.md                    # API endpoints
│   ├── AUTH_CONFIG.md            # Auth pages configuration
│   ├── BETTER_AUTH.md            # Better-Auth complete guide
│   ├── I18N.md                   # Internationalization guide
│   ├── COMPONENTS.md             # Components reference
│   ├── MIDDLEWARES.md            # Middlewares guide
│   └── COMPOSABLES.md            # Composables reference
├── .env.example                  # Environment variables template
├── app.config.ts                 # App configuration
├── auth.ts                       # Better-Auth export
├── content.config.ts             # Content module config
├── nuxt.config.ts                # Nuxt configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript configuration
```

---

## Development

### Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### Type Definitions

Generate TypeScript types:

```bash
pnpm nuxi prepare
```

### Code Style

The project uses ESLint and Prettier for code quality. Run:

```bash
# Lint code
pnpm lint

# Fix issues
pnpm lint:fix
```

### Testing

```bash
# Unit tests with Vitest
pnpm test

# E2E tests with Playwright
pnpm test:e2e
```

### Optional Content Module

Add the Nuxt Content module for file-based CMS:

```bash
pnpm add:content
```

The module is pre-configured in `nuxt.config.ts` and works out of the box.

---

## Production

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

### Generate Static Site

```bash
pnpm generate
```

### Deployment

The boilerplate works with any Nuxt-compatible hosting:

- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [Cloudflare Pages](https://pages.cloudflare.com)
- [Railway](https://railway.app)
- Self-hosted with Node.js

#### Environment Variables

Don't forget to set all required environment variables in production!

---

## Troubleshooting

### Common Issues

#### Node.js Version

Ensure you're using a compatible Node.js version (v20.19.5+):

```bash
node --version
```

#### Build Errors

Clear cache and reinstall:

```bash
# pnpm
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### TypeScript Errors

Regenerate type definitions:

```bash
pnpm nuxi prepare
```

Restart your IDE/editor after running this command.

#### Gradient Colors Not Showing

If gradient colors appear white on Tailwind 4, the issue is with dynamic class generation. The boilerplate now uses inline CSS styles to solve this. See [Auth Configuration - Troubleshooting](./doc/AUTH_CONFIG.md#solución-de-problemas) for details.

### Getting Help

- Check the [Nuxt 4 documentation](https://nuxt.com/docs)
- Visit the [@nuxt/ui documentation](https://ui.nuxt.com/)
- See [Better-Auth documentation](https://better-auth.com/docs)
- Search existing [GitHub Issues](https://github.com/arpixnet/nuxt4-ui-better-auth-boilerplate/issues)
- Join the [Nuxt Discord community](https://discord.com/invite/ps2h6QT)

---

## Contributing

Contributions are welcome! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m "Add your feature"`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request

### Guidelines

- Follow existing code style and conventions
- Write clear, descriptive commit messages
- Test in both development and production modes
- Update documentation as needed
- Ensure TypeScript types are properly defined

---

## Documentation

| Document | Description |
|----------|-------------|
| [Better-Auth Guide](./doc/BETTER_AUTH.md) | Complete Better-Auth configuration, JWT, social providers, database schema |
| [Auth Pages Config](./doc/AUTH_CONFIG.md) | Customize login/register pages: logos, colors, gradients, images |
| [Hasura Integration](./doc/HASURA_INTEGRATION.md) | GraphQL Engine integration with JWT authentication, permissions, and best practices |
| [API Reference](./doc/API.md) | All API endpoints and their usage |
| [Internationalization](./doc/I18N.md) | Multi-language support, adding new languages, translation files |
| [Components](./doc/COMPONENTS.md) | Layout components, auth components, customization guide |
| [Middlewares](./doc/MIDDLEWARES.md) | Route middleware, server middleware, custom middleware |
| [Composables](./doc/COMPOSABLES.md) | Authentication composables, utility composables, custom composables |

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Credits

Built with:

- [Nuxt 4](https://nuxt.com) - The Vue.js Framework
- [@nuxt/ui](https://ui.nuxt.com) - UI Component Library
- [Better-Auth](https://better-auth.com) - Authentication Solution
- [Tailwind CSS](https://tailwindcss.com) - Utility-First CSS Framework
- [@nuxtjs/i18n](https://i18n.nuxtjs.org) - Internationalization

---

**Built with ❤️ by [Arpix Solutions](https://arpixnet.com)**
