# Nuxt 4 + @nuxt/ui Boilerplate

A modern, production-ready boilerplate for building web applications with Nuxt 4 and @nuxt/ui. This template provides a solid foundation with essential modules, optimized configuration, and best practices for rapid development.

## Features

- ⚡ **Nuxt 4** - The latest version of the Vue.js framework
- 🎨 **@nuxt/ui** - Beautiful and accessible UI components built on Tailwind CSS
- 🖼️ **@nuxt/image** - Optimized image handling with automatic format conversion
- 📝 **@nuxt/content** - Optional content management system (easily addable)
- 🚀 **@nuxt/scripts** - Third-party script optimization
- 🎯 **TypeScript** - Full TypeScript support out of the box
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- ⚙️ **Optimized Configuration** - Production-ready settings and performance optimizations
- 🔐 **Better-Auth Integration** - Complete authentication system with email verification
- 📧 **Email System** - Beautiful email templates with nuxt-arpix-email-sender
- 🔧 **Development Tools** - Nuxt DevTools enabled for better DX

## Authentication System

This boilerplate includes a complete authentication system powered by **Better-Auth** with integrated email functionality using **nuxt-arpix-email-sender**.

### Features

- ✅ **Email & Password Authentication** - Secure user registration and login
- ✅ **Email Verification** - Optional email verification for new users
- ✅ **Password Reset** - Complete forgot password flow with email recovery
- ✅ **Welcome Emails** - Automatic welcome emails on registration
- ✅ **Beautiful Email Templates** - Professional HTML email templates
- ✅ **OAuth2 Social Login** - Support for multiple social providers
- ✅ **JWT Sessions** - Token-based authentication with Hasura integration
- ✅ **Password Strength** - Minimum 8 characters requirement
- ✅ **Real-time Validation** - Form validation with helpful error messages
- ✅ **Responsive Auth Pages** - Mobile-friendly authentication UI

### Configuration

#### Email Setup (Required for Email Features)

The email system uses **nuxt-arpix-email-sender** module. Configure it in `nuxt.config.ts`:

**Gmail OAuth2 (Recommended for Production):**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000` as authorized redirect URI (development)
6. Generate refresh token using OAuth 2.0 playground

```typescript
// nuxt.config.ts
arpixEmailSender: {
  transport: 'smtp',
  defaultFrom: '"Your App" <your-email@gmail.com>',
  smtp: {
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'your-email@gmail.com',
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    }
  },
  templates: {
    dir: 'server/emails/templates',
  },
}
```

**Gmail App Password (Development Only):**

1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password

```typescript
// nuxt.config.ts
arpixEmailSender: {
  transport: 'smtp',
  defaultFrom: '"Your App" <your-email@gmail.com>',
  smtp: {
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD,
    }
  },
  templates: {
    dir: 'server/emails/templates',
  },
}
```

#### Better-Auth Configuration

Better-Auth is configured in `server/lib/auth.ts` with the following options:

```typescript
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.BETTER_AUTH_EMAIL_VERIFICATION === "true",
    sendVerificationEmail: async ({ user, url }) => {
      // Sends welcome/verification email via nuxt-arpix-email-sender
    },
    sendResetPasswordEmail: async ({ user, url }) => {
      // Sends password reset email via nuxt-arpix-email-sender
    },
  },
  
  // Social providers are automatically configured from environment variables
  socialProviders: buildSocialProviders(),
})
```

#### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Application
APP_NAME=Your App Name

# Better-Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_EMAIL_VERIFICATION=true
BETTER_AUTH_DEFAULT_REDIRECT=/

# Database
DATABASE_URL=postgres://user:password@localhost:5432/your-db

# Email (Gmail OAuth2)
EMAIL_USER=your-email@gmail.com
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
```

### Email Templates

The system includes three professionally designed email templates:

#### 1. Welcome Email (`welcome.hbs`)
- Sent automatically on user registration
- Includes verification link if email verification is enabled
- Shows login link if verification is not required
- Responsive design with brand colors

#### 2. Verification Email (`verify-again.hbs`)
- Used for resending verification emails
- Clear call-to-action with verification button
- Includes helpful instructions
- Professional security messaging

#### 3. Password Reset Email (`reset-password.hbs`)
- Sent when user requests password reset
- Includes temporary reset link (1-hour expiration)
- Shows request details (IP, date) for security
- Warns about unauthorized requests

**Customizing Templates:**

Edit templates in `server/emails/templates/`:
- All templates use Handlebars syntax
- Variables available: `userName`, `userEmail`, `verificationLink`, `resetLink`, `loginUrl`, `appName`
- Fully responsive HTML/CSS included
- Easy to customize colors and branding

### Authentication Pages

The system includes the following pages:

#### Login (`/auth/login`)
- Email and password authentication
- Forgot password link
- Social login buttons (when configured)
- Remember me functionality
- Error handling with helpful messages

#### Register (`/auth/register`)
- Email and password registration
- Real-time form validation
- Automatic email verification (if enabled)
- Redirects to verify-email page after registration

#### Verify Email (`/auth/verify-email`)
- Shows verification status
- Option to resend verification email
- Clear instructions for user
- Already verified link

#### Forgot Password (`/auth/forgot-password`)
- Request password reset
- Email input with validation
- Success message (doesn't reveal if email exists)

#### Reset Password (`/auth/reset-password`)
- New password form
- Password confirmation
- Token-based validation
- Auto-redirect to login after success

### Usage Examples

#### Register a New User

```typescript
import { useAuthClient } from '~/lib/auth-client'

const authClient = useAuthClient()

const response = await authClient.signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
  callbackURL: '/',
})
```

#### Login User

```typescript
const response = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123',
  callbackURL: '/',
})
```

#### Reset Password

```typescript
// Request reset
await authClient.resetPassword({
  email: 'user@example.com',
  redirectTo: '/auth/reset-password',
})

// Update password with token from email
await authClient.resetPassword({
  newPassword: 'newpassword123',
  token: 'reset-token-from-email',
})
```

#### Access Session

```typescript
import { useAuthSession } from '~/composables/useAuthSession'

const session = useAuthSession()

// Access user data
console.log(session.session?.value?.user)

// Check if authenticated
console.log(session.session?.value !== null)

// Logout
await authClient.signOut()
```

### Social Login Configuration

Social providers are 100% dynamic and configured via environment variables:

```bash
# Google
SOCIAL_PROVIDER_GOOGLE_CLIENT_ID=your-client-id
SOCIAL_PROVIDER_GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub
SOCIAL_PROVIDER_GITHUB_CLIENT_ID=your-client-id
SOCIAL_PROVIDER_GITHUB_CLIENT_SECRET=your-client-secret

# Apple
SOCIAL_PROVIDER_APPLE_CLIENT_ID=your-client-id
SOCIAL_PROVIDER_APPLE_CLIENT_SECRET=your-client-secret
```

**Any OAuth 2.0 provider works automatically!**

Just add the environment variables following the convention:
`SOCIAL_PROVIDER_{PROVIDER}_{FIELD}`

Example: `SOCIAL_PROVIDER_PAYPAL_CLIENT_ID` → paypal.clientId

### Security Features

- 🔒 **Password Requirements** - Minimum 8 characters
- 🔒 **Email Verification** - Prevents fake accounts
- 🔒 **Token-based Reset** - Time-limited password reset tokens
- 🔒 **Secure Sessions** - JWT-based authentication
- 🔒 **Hasura Integration** - JWT claims for GraphQL
- 🔒 **Rate Limiting** - Email sending rate limits
- 🔒 **Environment Variables** - Sensitive data in `.env` only
- 🔒 **SQL Injection Protection** - Parameterized queries via Better-Auth

## Installation Instructions

### Method 1: Using nuxi (Recommended)

Create a new project using this template:

```bash
npx nuxi init my-project -t github:arpixnet/nuxt4-nuxt-ui-boilerplate
cd my-project
```

### Method 2: Git Clone

```bash
git clone https://github.com/arpixnet/nuxt4-nuxt-ui-boilerplate.git my-project
cd my-project
rm -rf .git
git init
```

### Install Dependencies

Choose your preferred package manager:

#### Using pnpm (Recommended)
```bash
pnpm install
```

#### Using npm
```bash
npm install
```

#### Using yarn
```bash
yarn install
```

## Optional Content Module

This boilerplate includes an easy way to add @nuxt/content for content management:

```bash
npm run add:content
```

This command will:
- Install @nuxt/content automatically
- The module is already configured in `nuxt.config.ts` to load conditionally
- CSS styles for content are automatically included when the module is present
- No additional configuration needed - it works out of the box!

After adding the content module, you can:
- Create `.md` files in the `content/` directory
- Access them via the `/example-content` route (already included)
- Use the powerful content query API in your components

## Development Server

Start the development server:

```bash
# Using pnpm
pnpm dev

# Using npm
npm run dev

# Using yarn
yarn dev
```

The application will be available at `http://localhost:3000`

## Production

### Build for Production

```bash
# Using pnpm
pnpm build

# Using npm
npm run build

# Using yarn
yarn build
```

### Preview Production Build

```bash
# Using pnpm
pnpm preview

# Using npm
npm run preview

# Using yarn
yarn preview
```

### Generate Static Site

```bash
# Using pnpm
pnpm generate

# Using npm
npm run generate

# Using yarn
yarn generate
```

## Project Structure

```
├── app/
│   ├── app.vue              # Root Vue component
│   ├── assets/              # Stylesheets, images, fonts
│   │   └── css/
│   │       ├── main.css     # Main styles
│   │       └── content.css  # Content module styles
│   ├── components/          # Vue components
│   ├── composables/         # Vue composables
│   ├── layouts/             # Layout components
│   │   └── default.vue      # Default layout
│   ├── middleware/          # Route middleware
│   ├── pages/               # File-based routing
│   │   ├── index.vue        # Home page
│   │   └── example-content.vue # Content example
│   └── plugins/             # Nuxt plugins
├── content/                 # Content files (when @nuxt/content is added)
│   └── example-content.md   # Example markdown content
├── public/                  # Static assets
│   ├── favicon.ico
│   └── robots.txt
├── server/                  # Server-side code
├── app.config.ts           # App configuration
├── content.config.ts       # Content module configuration
├── nuxt.config.ts          # Nuxt configuration
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Contributing

We welcome contributions to improve this boilerplate! Here's how you can help:

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/nuxt4-nuxt-ui-boilerplate.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your branch: `git push origin feature/your-feature-name`
8. Open a Pull Request

### Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Test your changes in both development and production modes
- Update documentation if needed
- Keep dependencies up to date
- Ensure TypeScript types are properly defined

### Reporting Issues

If you find a bug or have a suggestion:

1. Check if the issue already exists in the [Issues](https://github.com/arpixnet/nuxt4-nuxt-ui-boilerplate/issues) section
2. If not, create a new issue with:
   - Clear description of the problem or suggestion
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Environment details (Node.js version, package manager, OS)

## Troubleshooting

### Common Issues

#### Node.js Version Compatibility
**Problem**: Build fails or dependencies don't install properly
**Solution**: Ensure you're using Node.js v20.19.5 or compatible version as specified in `package.json`

```bash
node --version  # Should be v20.19.5 or compatible
```

#### Package Manager Issues
**Problem**: Dependencies fail to install or version conflicts
**Solution**:
1. Clear cache and reinstall:
   ```bash
   # For npm
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install

   # For pnpm
   pnpm store prune
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

#### @nuxt/content Not Working
**Problem**: Content module doesn't load after running `npm run add:content`
**Solution**:
1. Restart the development server after adding the content module
2. Ensure the content directory exists and contains `.md` files
3. Check that the module is properly detected in the Nuxt config

#### Build Errors in Production
**Problem**: Application builds successfully but fails in production
**Solution**:
1. Check for environment-specific configurations
2. Ensure all dependencies are properly installed
3. Verify that the `nitro.compressPublicAssets` setting is compatible with your deployment platform

#### TypeScript Errors
**Problem**: TypeScript compilation errors
**Solution**:
1. Run `npx nuxi prepare` to regenerate type definitions
2. Restart your IDE/editor
3. Check that all dependencies have proper type definitions

### Getting Help

If you're still experiencing issues:

1. Check the [Nuxt 4 documentation](https://nuxt.com/docs)
2. Visit the [@nuxt/ui documentation](https://ui.nuxt.com/)
3. Search existing [GitHub Issues](https://github.com/arpixnet/nuxt4-nuxt-ui-boilerplate/issues)
4. Join the [Nuxt Discord community](https://discord.com/invite/ps2h6QT)

## Changelog

### v1.0.0 (2025-09-04)

**Initial Release**

- ✨ Initial boilerplate setup with Nuxt 4
- ✨ Integrated @nuxt/ui for component library
- ✨ Added @nuxt/image for optimized image handling
- ✨ Included @nuxt/scripts for third-party script optimization
- ✨ Optional @nuxt/content integration with automatic configuration
- ✨ TypeScript support with proper type definitions
- ✨ Responsive default layout
- ✨ Production-ready configuration with compression
- ✨ SQLite database integration with better-sqlite3
- ✨ Development tools and DevTools enabled
- ✨ Example pages and content structure
- 📚 Comprehensive documentation and setup instructions

---

**Built with ❤️ using Nuxt 4 and @nuxt/ui**

For more information, visit:
- [Nuxt 4 Documentation](https://nuxt.com/docs)
- [@nuxt/ui Documentation](https://ui.nuxt.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
