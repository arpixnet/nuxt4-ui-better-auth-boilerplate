# Hasura + Better-Auth Integration

This document explains how Hasura GraphQL Engine is integrated with Better-Auth using JWT authentication.

## Overview

The integration uses a shared HMAC-SHA256 (HS256) secret between Better-Auth and Hasura. When a user authenticates through Better-Auth, a JWT is generated with Hasura-specific claims. Hasura validates this JWT using the same shared secret to authorize GraphQL queries and mutations.

## Architecture

```
┌─────────────────┐
│   Client (Nuxt) │
└────────┬────────┘
         │
         │ 1. Login/Register
         ▼
┌─────────────────┐
│  Better-Auth    │
│  (JWT Signing)  │
└────────┬────────┘
         │
         │ 2. JWT with Hasura claims
         ▼
┌─────────────────┐
│   Client (Nuxt) │
│   (stores JWT)   │
└────────┬────────┘
         │
         │ 3. GraphQL Query with Authorization header
         ▼
┌─────────────────┐
│   Hasura        │
│   (JWT Verify)  │
└────────┬────────┘
         │
         │ 4. Authorized Query
         ▼
┌─────────────────┐
│   PostgreSQL    │
└─────────────────┘
```

## Configuration

### 1. Environment Variables

The following environment variables are required in `.env`:

```bash
# Shared secret for Better-Auth and Hasura
BETTER_AUTH_SECRET=your-secret-here-minimum-32-characters-required

# Better-Auth base URL
BETTER_AUTH_URL=http://localhost:3000

# Enable Hasura integration
BETTER_AUTH_WITH_HASURA=true

# PostgreSQL configuration (used by both app and Hasura)
DATABASE_USER=postgres
DATABASE_PASSWORD=postgrespassword
DATABASE_NAME=whasabi_db

# Hasura admin secret (separate from Better-Auth secret)
HASURA_ADMIN_SECRET=your-hasura-admin-secret-minimum-32-characters
```

### 2. Docker Compose

Hasura is configured in `docker/docker-compose.yml` to use environment variables:

```yaml
services:
  postgres:
    environment:
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}

  graphql-engine:
    environment:
      HASURA_GRAPHQL_DATABASE_URL: postgres://${DATABASE_USER}:${DATABASE_PASSWORD}@postgres:5432/${DATABASE_NAME}
      HASURA_GRAPHQL_ADMIN_SECRET: ${HASURA_ADMIN_SECRET}
      HASURA_GRAPHQL_JWT_SECRET: '{"type":"HS256","key":"${BETTER_AUTH_SECRET}"}'
```

This configuration allows you to manage all sensitive values from a single `.env` file.

### 3. Better-Auth JWT Claims

The JWT payload includes Hasura-specific claims defined in `server/lib/auth.ts`:

```typescript
{
  "sub": "user-id",
  "email": "user@example.com",
  "sessionId": "session-id",
  "https://hasura.io/jwt/claims": {
    "x-hasura-user-id": "user-id",
    "x-hasura-default-role": "user",
    "x-hasura-allowed-roles": ["user", "admin"]
  }
}
```

## Using JWT with GraphQL

### 1. Get the JWT from Better-Auth

After login, Better-Auth sets a session cookie. You can retrieve the JWT:

```typescript
// In your Nuxt application
import { useAuthSession } from '~/composables/useAuthSession'

const { session } = await useAuthSession()

// The JWT is in session.accessToken
const jwt = session.value?.accessToken
```

### 2. Include JWT in GraphQL Requests

When making GraphQL queries to Hasura, include the JWT in the `Authorization` header:

```typescript
const response = await fetch('http://localhost:8080/v1/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwt}`,
  },
  body: JSON.stringify({
    query: `
      query GetUserData {
        user(where: { id: { _eq: "${userId}" }) {
          id
          email
          name
        }
      }
    `,
  }),
})
```

### 3. Using Session Variables in Hasura

The JWT claims are available as session variables in Hasura permissions:

```
X-Hasura-User-Id: The authenticated user's ID
X-Hasura-Role: The user's role (user, admin, etc.)
```

Example permission rule in Hasura:

```graphql
{
  "filter": {
    "user_id": {
      "_eq": "X-Hasura-User-Id"
    }
  }
}
```

This ensures users can only access their own data.

## Customizing Roles

To add custom roles (e.g., `admin`, `moderator`, `premium_user`):

### Step 1: Define Role in Database

```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES user(id),
  role VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, role)
);
```

### Step 2: Update Better-Auth JWT Payload

Modify `server/lib/auth.ts` to fetch roles dynamically:

```typescript
definePayload: async ({ user, session }) => {
  // Fetch user roles from database
  const userRoles = await getUserRoles(user.id)
  
  const defaultRole = userRoles.includes('admin') ? 'admin' : 'user'
  
  return {
    sub: user.id,
    email: user.email,
    sessionId: session.id,
    "https://hasura.io/jwt/claims": {
      "x-hasura-user-id": user.id,
      "x-hasura-default-role": defaultRole,
      "x-hasura-allowed-roles": userRoles,
    },
  }
}
```

### Step 3: Configure Hasura Permissions

In Hasura Console, define permissions for each role:

1. Go to `Data` → `your_table` → `Permissions`
2. Create permissions for each role (user, admin, etc.)
3. Use session variables in row/column permissions

## Security Considerations

### 1. Secret Strength

Generate a strong secret:

```bash
openssl rand -base64 64
```

### 2. Secret Rotation

Regularly rotate the `BETTER_AUTH_SECRET`:

1. Generate a new secret
2. Update `.env` with the new secret
3. Restart Docker services: `docker-compose restart graphql-engine`
4. Restart your Nuxt application

Existing JWTs remain valid until they expire (default: 7 days).

### 3. Expiration Time

Configure JWT expiration based on your security requirements:

```bash
# Short expiration (high security)
BETTER_AUTH_JWT_EXPIRATION_TIME=1h

# Long expiration (better UX)
BETTER_AUTH_JWT_EXPIRATION_TIME=7d
```

### 4. Disable Hasura Console in Production

Set in `docker/docker-compose.yml`:

```yaml
HASURA_GRAPHQL_ENABLE_CONSOLE: "false"
```

## Testing

### 1. Start Docker Services

```bash
docker-compose up -d
```

### 2. Verify Hasura is Configured

```bash
curl http://localhost:8080/v1/query \
  -H 'Content-Type: application/json' \
  -H 'x-hasura-admin-secret: myadminsecretkey' \
  -d '{
    "type": "run_sql",
    "args": {"sql": "SELECT version()"}
  }'
```

### 3. Test JWT Flow

1. Login through Better-Auth
2. Get JWT from session
3. Make GraphQL query with JWT
4. Verify data is filtered by `X-Hasura-User-Id`

## Troubleshooting

### Issue: "Invalid JWT" Error

**Solution:** 
- Verify `BETTER_AUTH_SECRET` is the same in `.env` and Docker
- Restart services: `docker-compose restart graphql-engine`

### Issue: Hasura Cannot Connect to Database

**Solution:**
- Ensure PostgreSQL is running: `docker-compose ps postgres`
- Check database URL in docker-compose.yml

### Issue: JWT Claims Not Working

**Solution:**
- Verify `BETTER_AUTH_WITH_HASURA=true` in `.env`
- Check Hasura logs: `docker-compose logs graphql-engine`
- Decode JWT at https://jwt.io to verify claims structure

## Advanced Topics

### 1. Custom Session Variables

Add custom variables to JWT claims:

```typescript
"https://hasura.io/jwt/claims": {
  "x-hasura-user-id": user.id,
  "x-hasura-default-role": "user",
  "x-hasura-allowed-roles": ["user", "admin"],
  "x-hasura-org-id": user.organizationId, // Custom variable
  "x-hasura-tenant-id": user.tenantId,   // Custom variable
}
```

Use in Hasura permissions: `X-Hasura-Org-Id`, `X-Hasura-Tenant-Id`

### 2. Multiple Role Types

Implement hierarchical roles with inheritance:

```typescript
const roleHierarchy = {
  admin: ['user', 'moderator', 'admin'],
  moderator: ['user', 'moderator'],
  user: ['user'],
}

const allowedRoles = roleHierarchy[user.role] || ['user']
```

### 3. Webhooks for Complex Validations

Use Hasura Event Triggers for:
- Email notifications on data changes
- Analytics tracking
- Synchronization with external services
- Complex validations not possible with SQL alone

See [HASURA_WEBHOOKS.md](./HASURA_WEBHOOKS.md) for details.

## References

- [Better-Auth Documentation](https://www.better-auth.com/docs)
- [Hasura JWT Authentication](https://hasura.io/docs/latest/auth/authentication/jwt/)
- [Hasura Session Variables](https://hasura.io/docs/latest/auth/authorization/session-variables/)
- [Hasura Permissions](https://hasura.io/docs/latest/auth/authorization/permissions/)
