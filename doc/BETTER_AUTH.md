# Better-Auth Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Server Configuration](#server-configuration)
3. [Session Configuration](#session-configuration)
4. [JWT Configuration](#jwt-configuration)
5. [Social Providers (100% Dynamic)](#social-providers-100-dynamic)
6. [Email/Password Authentication](#emailpassword-authentication)
7. [Trusted Origins](#trusted-origins)
8. [Authentication Client](#authentication-client)
9. [Authentication Endpoint](#authentication-endpoint)
10. [Runtime Configuration](#runtime-configuration)
11. [Environment Variables](#environment-variables)
12. [Database Schema](#database-schema)

---

## Introduction

This boilerplate uses [Better-Auth](https://www.better-auth.com/) for authentication, providing a flexible and production-ready authentication system.

### Key Features

- **100% Dynamic Social Providers**: Works with ANY OAuth provider without code changes
- **Hasura Integration**: JWT claims for GraphQL authentication
- **Email/Password Authentication**: Built-in credential-based auth
- **Session Management**: Configurable session and JWT expiration times
- **TypeScript**: Full type safety throughout the codebase

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Nuxt Application                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Client)                                  │
│  └── app/lib/auth-client.ts                          │
│      └── authClient (createAuthClient)                  │
│                                                         │
│  Server (Backend)                                    │
│  ├── server/api/auth/[...all].ts  (Endpoint)          │
│  └── server/lib/auth.ts  (Configuration)             │
│       ├── toCamelCase()                                │
│       ├── parseEnvValue()                               │
│       ├── buildSocialProviders()                            │
│       └── export const auth                             │
│                                                         │
│  Configuration (Nuxt)                                 │
│  └── nuxt.config.ts (Runtime config)                  │
│       └── process.env variables                         │
│                                                         │
│  Environment Variables                                   │
│  └── .env / .env.example                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Server Configuration

**File:** `server/lib/auth.ts`

### Overview

The server configuration initializes Better-Auth with database connection, session management, JWT plugin, and social providers.

### Core Instance

```typescript
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { Pool } from "pg"

const config = useRuntimeConfig()

export const auth = betterAuth({
  baseURL: config.betterAuth.url,
  secret: config.betterAuth.secret,

  database: new Pool({
    connectionString: config.databaseUrl,
  }),
  
  // Session, JWT, social providers, email/password, etc.
})
```

### Database Connection

```typescript
database: new Pool({
  connectionString: config.databaseUrl,
})
```

- Uses PostgreSQL via `pg` Pool
- Connection string from runtime config
- Automatic connection pooling

---

## Session Configuration

**File:** `server/lib/auth.ts`

### Configuration

```typescript
session: {
  expiresIn: parseInt(process.env.BETTER_AUTH_SESSION_EXPIRES_IN || "") || 60 * 60 * 24 * 7,
  updateAge: parseInt(process.env.BETTER_AUTH_SESSION_UPDATE_AGE || "") || 60 * 60 * 24,
  cookieCache: {
    enabled: true,
    maxAge: parseInt(process.env.BETTER_AUTH_COOKIE_MAX_AGE || "") || 5 * 60,
    strategy: "jwt",
    refreshCache: true,
  }
}
```

### Parameters

| Parameter | Environment Variable | Default | Description |
|-----------|---------------------|-----------|-------------|
| `expiresIn` | `BETTER_AUTH_SESSION_EXPIRES_IN` | `60 * 60 * 24 * 7` (7 days) | Session expiration in seconds |
| `updateAge` | `BETTER_AUTH_SESSION_UPDATE_AGE` | `60 * 60 * 24` (1 day) | How often to update session activity |
| `cookieCache.maxAge` | `BETTER_AUTH_COOKIE_MAX_AGE` | `5 * 60` (5 minutes) | Cookie validity in cache before refresh |
| `cookieCache.strategy` | N/A | `"jwt"` | Cookie caching strategy |
| `cookieCache.refreshCache` | N/A | `true` | Enable cache refresh |

### Behavior

1. **Session Expiration**: Users must re-authenticate after `expiresIn` seconds
2. **Update Age**: Session activity timestamp is updated every `updateAge` seconds
3. **Cookie Cache**: Tokens are cached for `maxAge` seconds to reduce database queries

---

## JWT Configuration

**File:** `server/lib/auth.ts`

### Configuration

```typescript
plugins: [
  jwt({
    jwt: {
      expirationTime: process.env.BETTER_AUTH_JWT_EXPIRATION_TIME || "7d",
        issuer: config.betterAuth.url,
        audience: ["hasura"],

        definePayload: async ({ user, session }) => {
          const hasuraEnabled = config.betterAuth.withHasura

          const base = {
            sub: user.id,
            email: user.email,
            sessionId: session.id,
          }

          if (!hasuraEnabled) return base

          return {
            ...base,
            "https://hasura.io/jwt/claims": {
              "x-hasura-user-id": user.id,
            },
          }
        },
    },
  }),
]
```

### Parameters

| Parameter | Environment Variable | Default | Description |
|-----------|---------------------|-----------|-------------|
| `expirationTime` | `BETTER_AUTH_JWT_EXPIRATION_TIME` | `"7d"` | JWT token expiration (format: "7d", "24h", "30m") |
| `issuer` | N/A | `config.betterAuth.url` | JWT issuer URL |
| `audience` | N/A | `["hasura"]` | JWT audience |

### Payload Structure

**Base Payload (no Hasura):**
```typescript
{
  sub: user.id,
  email: user.email,
  sessionId: session.id
}
```

**Hasura Payload (when `BETTER_AUTH_WITH_HASURA=true`):**
```typescript
{
  sub: user.id,
  email: user.email,
  sessionId: session.id,
  "https://hasura.io/jwt/claims": {
    "x-hasura-user-id": user.id
  }
}
```

### Customizing Hasura Claims

The `definePayload` function can be customized to add roles and permissions:

```typescript
// Note: Roles and permissions are project-specific.
// Uncomment and customize as needed:

// const rolesData = await getUserRolesAndOrganization(user.id)
//
// return {
//   ...base,
//   "https://hasura.io/jwt/claims": {
//     "x-hasura-default-role": rolesData.defaultRole,
//     "x-hasura-allowed-roles": rolesData.allowedRoles,
//     "x-hasura-user-id": user.id,
//   },
// }
```

---

## Social Providers (100% Dynamic)

**File:** `server/lib/auth.ts`

### Convention

**Environment Variable Format:**
```
SOCIAL_PROVIDER_{PROVIDER}_{FIELD_NAME}
```

**Conversion:**
- All field names in SNAKE_CASE
- Automatically converted to camelCase
- Arrays: Comma-separated values

### Helper Functions

#### 1. `toCamelCase()` - Name Conversion

```typescript
const toCamelCase = (str: string): string => {
  return str
    .toLowerCase()
    .split("_")
    .map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("")
}
```

**Examples:**
- `CLIENT_ID` → `clientId`
- `CLIENT_SECRET` → `clientSecret`
- `CLIENT_KEY` → `clientKey`
- `APP_BUNDLE_IDENTIFIER` → `appBundleIdentifier`
- `TENANT_ID` → `tenantId`

#### 2. `parseEnvValue()` - Array Detection

```typescript
const parseEnvValue = (value: string): string | string[] => {
  // Check if it's an array (contains comma)
  if (value.includes(',')) {
    return value.split(',').map(item => item.trim())
  }
  return value
}
```

**Examples:**
- `"read,submit"` → `["read", "submit"]`
- `"clientId"` → `"clientId"`
- `"user:read,email"` → `["user:read", "email"]`

#### 3. `buildSocialProviders()` - Dynamic Provider Builder

```typescript
const buildSocialProviders = () => {
  // Find all SOCIAL_PROVIDER_* environment variables
  const providerVars = Object.keys(process.env)
    .filter(key => key.startsWith("SOCIAL_PROVIDER_"))
  
  // Group variables by provider name
  const providersMap: Record<string, Record<string, string | string[]>> = {}
  
  for (const varName of providerVars) {
    const value = process.env[varName]
    if (!value) continue
    
    // Extract provider and field name
    // Format: SOCIAL_PROVIDER_GOOGLE_CLIENT_ID
    const parts = varName.split("_")
    const provider = parts[2].toLowerCase()
    const rawField = parts.slice(3).join("_") // CLIENT_ID
    
    // Convert SNAKE_CASE to camelCase
    const field = toCamelCase(rawField)
    
    // Parse value (string or array)
    const parsedValue = parseEnvValue(value)
    
    if (!providersMap[provider]) {
      providersMap[provider] = {}
    }
    
    providersMap[provider][field] = parsedValue
  }
  
  // Return all providers without validation
  // Better-Auth will handle validation and throw errors if something is missing
  return providersMap
}
```

### Features

- ✅ **100% DYNAMIC**: Works with ANY provider (Google, PayPal, Twitter, etc.)
- ✅ **Automatic SNAKE_CASE to camelCase conversion**
- ✅ **Automatic array detection (comma-separated values)**
- ✅ **NO PRE-VALIDATION**: Better-Auth handles validation and errors
- ✅ **No code changes needed for new providers**

### Usage Examples

#### Standard OAuth 2.0 (clientId + clientSecret)

**Environment Variables:**
```bash
SOCIAL_PROVIDER_GOOGLE_CLIENT_ID=xxx
SOCIAL_PROVIDER_GOOGLE_CLIENT_SECRET=xxx
```

**Generated Configuration:**
```typescript
{
  google: {
    clientId: "xxx",
    clientSecret: "xxx"
  }
}
```

#### TikTok (CLIENT_KEY instead of clientId)

**Environment Variables:**
```bash
SOCIAL_PROVIDER_TIKTOK_CLIENT_KEY=xxx
SOCIAL_PROVIDER_TIKTOK_CLIENT_SECRET=xxx
```

**Generated Configuration:**
```typescript
{
  tiktok: {
    clientKey: "xxx",
    clientSecret: "xxx"
  }
}
```

#### Microsoft (Optional TENANT_ID)

**Environment Variables:**
```bash
SOCIAL_PROVIDER_MICROSOFT_CLIENT_ID=xxx
SOCIAL_PROVIDER_MICROSOFT_CLIENT_SECRET=xxx
SOCIAL_PROVIDER_MICROSOFT_TENANT_ID=common
```

**Generated Configuration:**
```typescript
{
  microsoft: {
    clientId: "xxx",
    clientSecret: "xxx",
    tenantId: "common"
  }
}
```

#### Reddit (Array for scope)

**Environment Variables:**
```bash
SOCIAL_PROVIDER_REDDIT_CLIENT_ID=xxx
SOCIAL_PROVIDER_REDDIT_CLIENT_SECRET=xxx
SOCIAL_PROVIDER_REDDIT_DURATION=permanent
SOCIAL_PROVIDER_REDDIT_SCOPE=read,submit
```

**Generated Configuration:**
```typescript
{
  reddit: {
    clientId: "xxx",
    clientSecret: "xxx",
    duration: "permanent",
    scope: ["read", "submit"]  // Array
  }
}
```

#### Twitch (Multiple scopes)

**Environment Variables:**
```bash
SOCIAL_PROVIDER_TWITCH_CLIENT_ID=xxx
SOCIAL_PROVIDER_TWITCH_CLIENT_SECRET=xxx
SOCIAL_PROVIDER_TWITCH_SCOPE=user:read,email,channel:read
```

**Generated Configuration:**
```typescript
{
  twitch: {
    clientId: "xxx",
    clientSecret: "xxx",
    scope: ["user:read", "email", "channel:read"]  // Array
  }
}
```

### Adding a New Provider

**Step 1:** Add environment variables to `.env`

```bash
SOCIAL_PROVIDER_NEWPROVIDER_CLIENT_ID=xxx
SOCIAL_PROVIDER_NEWPROVIDER_CLIENT_SECRET=yyy
```

**Step 2:** That's it! No code changes needed.

Better-Auth will automatically detect and configure the provider. If the configuration is invalid, Better-Auth will throw an informative error.

---

## Email/Password Authentication

**File:** `server/lib/auth.ts`

### Configuration

```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: config.betterAuth.emailVerification || false,
}
```

### Parameters

| Parameter | Environment Variable | Default | Description |
|-----------|---------------------|-----------|-------------|
| `enabled` | N/A | `true` | Enable email/password authentication |
| `requireEmailVerification` | `BETTER_AUTH_EMAIL_VERIFICATION` | `false` | Require email verification before login |

### Behavior

1. Users can register with email and password
2. If `requireEmailVerification` is `true`, users must verify their email before logging in
3. Email verification tokens are stored in the `verification` table

---

## Trusted Origins

**File:** `server/lib/auth.ts`

### Configuration

```typescript
trustedOrigins: ["https://appleid.apple.com"]
```

### Purpose

Required for Apple Sign In. This origin is whitelisted to allow redirects from Apple's authentication servers.

### Adding Origins

To add more trusted origins:

```typescript
trustedOrigins: [
  "https://appleid.apple.com",
  "https://your-app.com",
  "https://your-other-app.com"
]
```

---

## Authentication Client

**File:** `app/lib/auth-client.ts`

### Configuration

```typescript
import { createAuthClient } from "better-auth/vue"
import { jwtClient } from "better-auth/client/plugins"

const config = useRuntimeConfig()

export const authClient = createAuthClient({
  baseURL: config.public.betterAuth.url,
  plugins: [
    jwtClient(),
  ],
})

export type AuthClient = typeof authClient
```

### Purpose

The authentication client is used in the frontend to:
- Sign in with social providers
- Sign in with email/password
- Sign out
- Get current session
- Get JWT tokens

### Available Methods

The client provides all Better-Auth client methods:

```typescript
// Social authentication
await authClient.signIn.social({
  provider: 'google',
  callbackURL: '/dashboard'
})

// Email/password authentication
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123',
  callbackURL: '/dashboard'
})

// Sign out
await authClient.signOut()

// Get session
const session = await authClient.getSession()

// Get JWT
const jwt = await authClient.getJWT()
```

### Usage Example

```vue
<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const signInWithGoogle = async () => {
  await authClient.signIn.social({
    provider: 'google',
    callbackURL: '/dashboard'
  })
}

const signInWithEmail = async () => {
  await authClient.signIn.email({
    email: 'user@example.com',
    password: 'password123',
    callbackURL: '/dashboard'
  })
}

const signOut = async () => {
  await authClient.signOut()
}
</script>

<template>
  <button @click="signInWithGoogle">
    Sign in with Google
  </button>
  
  <button @click="signInWithEmail">
    Sign in with Email
  </button>
  
  <button @click="signOut">
    Sign out
  </button>
</template>
```

---

## Authentication Endpoint

**File:** `server/api/auth/[...all].ts`

### Implementation

```typescript
import { auth } from "../../lib/auth"

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event));
});
```

### Purpose

This is a catch-all endpoint that handles all Better-Auth routes:

- `/api/auth/sign-in/social`
- `/api/auth/sign-in/email`
- `/api/auth/sign-out`
- `/api/auth/session`
- `/api/auth/jwt`
- And all other Better-Auth endpoints

The endpoint forwards requests to the Better-Auth handler, which processes authentication logic.

---

## Runtime Configuration

**File:** `nuxt.config.ts`

### Public Configuration (Client-Side)

```typescript
runtimeConfig: {
  public: {
    betterAuth: {
      url: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    }
  }
}
```

**Available on Client:**
```typescript
const config = useRuntimeConfig()
console.log(config.public.betterAuth.url) // "http://localhost:3000"
```

### Private Configuration (Server-Side)

```typescript
runtimeConfig: {
  betterAuth: {
    secret: process.env.BETTER_AUTH_SECRET || "",
    url: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    withHasura: process.env.BETTER_AUTH_WITH_HASURA === "true",
    emailVerification: process.env.BETTER_AUTH_EMAIL_VERIFICATION === "true"
  }
}
```

**Available on Server:**
```typescript
const config = useRuntimeConfig()
console.log(config.betterAuth.secret) // Secret value
console.log(config.betterAuth.withHasura) // boolean
```

### Database Configuration

```typescript
runtimeConfig: {
  databaseUrl: process.env.DATABASE_URL || ""
}
```

---

## Environment Variables

**File:** `.env.example` (copy to `.env` and fill in values)

### Basic Configuration

| Variable | Required | Default | Description |
|-----------|-----------|-----------|-------------|
| `BETTER_AUTH_SECRET` | Yes | N/A | Secret key for Better-Auth |
| `BETTER_AUTH_URL` | Yes | `http://localhost:3000` | Base URL for authentication |
| `BETTER_AUTH_WITH_HASURA` | No | `false` | Enable Hasura JWT claims |
| `BETTER_AUTH_EMAIL_VERIFICATION` | No | `false` | Require email verification |
| `DATABASE_URL` | Yes | N/A | PostgreSQL connection string |

### Session & JWT Configuration

| Variable | Default | Description |
|-----------|-----------|-------------|
| `BETTER_AUTH_SESSION_EXPIRES_IN` | `604800` (7 days) | Session expiration in seconds |
| `BETTER_AUTH_SESSION_UPDATE_AGE` | `86400` (1 day) | Session update frequency in seconds |
| `BETTER_AUTH_COOKIE_MAX_AGE` | `300` (5 minutes) | Cookie cache duration in seconds |
| `BETTER_AUTH_JWT_EXPIRATION_TIME` | `"7d"` | JWT expiration time (format: "7d", "24h", "30m") |

### Social Providers

**Convention:** `SOCIAL_PROVIDER_{PROVIDER}_{FIELD_NAME}`

**Examples from `.env.example`:**

```bash
# Standard OAuth 2.0 providers (clientId + clientSecret)
SOCIAL_PROVIDER_GOOGLE_CLIENT_ID=
SOCIAL_PROVIDER_GOOGLE_CLIENT_SECRET=

SOCIAL_PROVIDER_FACEBOOK_CLIENT_ID=
SOCIAL_PROVIDER_FACEBOOK_CLIENT_SECRET=

SOCIAL_PROVIDER_GITHUB_CLIENT_ID=
SOCIAL_PROVIDER_GITHUB_CLIENT_SECRET=

SOCIAL_PROVIDER_DISCORD_CLIENT_ID=
SOCIAL_PROVIDER_DISCORD_CLIENT_SECRET=

SOCIAL_PROVIDER_LINKEDIN_CLIENT_ID=
SOCIAL_PROVIDER_LINKEDIN_CLIENT_SECRET=

SOCIAL_PROVIDER_SPOTIFY_CLIENT_ID=
SOCIAL_PROVIDER_SPOTIFY_CLIENT_SECRET=

SOCIAL_PROVIDER_TWITCH_CLIENT_ID=
SOCIAL_PROVIDER_TWITCH_CLIENT_SECRET=

# TikTok (CLIENT_KEY -> clientKey automatically)
SOCIAL_PROVIDER_TIKTOK_CLIENT_KEY=
SOCIAL_PROVIDER_TIKTOK_CLIENT_SECRET=

# Microsoft (TENANT_ID -> tenantId automatically)
SOCIAL_PROVIDER_MICROSOFT_CLIENT_ID=
SOCIAL_PROVIDER_MICROSOFT_CLIENT_SECRET=
SOCIAL_PROVIDER_MICROSOFT_TENANT_ID=common

# Reddit (comma-separated scope array)
SOCIAL_PROVIDER_REDDIT_CLIENT_ID=
SOCIAL_PROVIDER_REDDIT_CLIENT_SECRET=
SOCIAL_PROVIDER_REDDIT_DURATION=permanent
SOCIAL_PROVIDER_REDDIT_SCOPE=read,submit

# Twitch (comma-separated scope array)
SOCIAL_PROVIDER_TWITCH_CLIENT_ID=
SOCIAL_PROVIDER_TWITCH_CLIENT_SECRET=
SOCIAL_PROVIDER_TWITCH_SCOPE=user:read,email,channel:read

# Apple (APP_BUNDLE_IDENTIFIER -> appBundleIdentifier automatically)
SOCIAL_PROVIDER_APPLE_CLIENT_ID=
SOCIAL_PROVIDER_APPLE_CLIENT_SECRET=
SOCIAL_PROVIDER_APPLE_APP_BUNDLE_IDENTIFIER=
```

### Time Conversion Reference

| Duration | Seconds | JWT Format |
|----------|---------|--------------|
| 1 minute | 60 | `"1m"` |
| 5 minutes | 300 | `"5m"` |
| 10 minutes | 600 | `"10m"` |
| 30 minutes | 1800 | `"30m"` |
| 1 hour | 3600 | `"1h"` |
| 8 hours | 28800 | `"8h"` |
| 1 day | 86400 | `"1d"` |
| 7 days | 604800 | `"7d"` |
| 30 days | 2592000 | `"30d"` |

---

## Database Schema

**File:** `better-auth_migrations/2025-12-17T04-47-07.365Z.sql`

### Tables

#### `user`

Stores user information.

```sql
CREATE TABLE "user" (
  "id" text NOT NULL PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL,
  "image" text,
  "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | User ID (primary key) |
| `name` | text | User's name |
| `email` | text | User's email (unique) |
| `emailVerified` | boolean | Email verification status |
| `image` | text | Profile image URL |
| `createdAt` | timestamptz | Creation timestamp |
| `updatedAt` | timestamptz | Last update timestamp |

#### `session`

Stores active user sessions.

```sql
CREATE TABLE "session" (
  "id" text NOT NULL PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Session ID (primary key) |
| `expiresAt` | timestamptz | Session expiration time |
| `token` | text | Session token (unique) |
| `createdAt` | timestamptz | Creation timestamp |
| `updatedAt` | timestamptz | Last update timestamp |
| `ipAddress` | text | IP address of session |
| `userAgent` | text | User agent string |
| `userId` | text | Foreign key to user (cascade delete) |

#### `account`

Stores authentication provider accounts linked to users.

```sql
CREATE TABLE "account" (
  "id" text NOT NULL PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Account ID (primary key) |
| `accountId` | text | Provider account ID |
| `providerId` | text | Provider identifier (e.g., "google", "github") |
| `userId` | text | Foreign key to user (cascade delete) |
| `accessToken` | text | OAuth access token |
| `refreshToken` | text | OAuth refresh token |
| `idToken` | text | OAuth ID token |
| `accessTokenExpiresAt` | timestamptz | Access token expiration |
| `refreshTokenExpiresAt` | timestamptz | Refresh token expiration |
| `scope` | text | OAuth scope |
| `password` | text | Hashed password (for email/password auth) |
| `createdAt` | timestamptz | Creation timestamp |
| `updatedAt` | timestamptz | Last update timestamp |

#### `verification`

Stores email verification tokens.

```sql
CREATE TABLE "verification" (
  "id" text NOT NULL PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Verification ID (primary key) |
| `identifier` | text | Email address or identifier |
| `value` | text | Verification token |
| `expiresAt` | timestamptz | Token expiration time |
| `createdAt` | timestamptz | Creation timestamp |
| `updatedAt` | timestamptz | Last update timestamp |

### Indexes

```sql
CREATE INDEX "session_userId_idx" ON "session" ("userId");
CREATE INDEX "account_userId_idx" ON "account" ("userId");
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");
```

| Index | Table | Column | Purpose |
|--------|------|---------|---------|
| `session_userId_idx` | `session` | `userId` | Fast user session lookups |
| `account_userId_idx` | `account` | `userId` | Fast user account lookups |
| `verification_identifier_idx` | `verification` | `identifier` | Fast email verification lookups |

---

## Summary

This boilerplate provides a complete authentication system with:

- ✅ **100% Dynamic Social Providers**: Works with ANY OAuth provider
- ✅ **Hasura Integration**: Ready for GraphQL JWT authentication
- ✅ **Email/Password Auth**: Built-in credential-based authentication
- ✅ **Configurable Sessions**: Customizable session and JWT expiration
- ✅ **TypeScript**: Full type safety
- ✅ **Production Ready**: Well-documented and tested

### Key Files

| File | Purpose |
|------|---------|
| `server/lib/auth.ts` | Server-side Better-Auth configuration |
| `app/lib/auth-client.ts` | Client-side authentication client |
| `server/api/auth/[...all].ts` | Catch-all authentication endpoint |
| `nuxt.config.ts` | Runtime configuration |
| `.env.example` | Environment variable template |

### Next Steps

1. Copy `.env.example` to `.env` and fill in values
2. Configure database connection
3. Set up social providers as needed
4. Implement authentication UI pages
5. Test authentication flow

---

## References

- [Better-Auth Documentation](https://www.better-auth.com/)
- [Nuxt Documentation](https://nuxt.com)
- [Hasura Documentation](https://hasura.io/docs/)
