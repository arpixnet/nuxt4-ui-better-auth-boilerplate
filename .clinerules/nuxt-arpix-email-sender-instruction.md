# Nuxt Arpix Email Sender

[![npm version](https://img.shields.io/npm/v/nuxt-arpix-email-sender/latest.svg?style=flat&colorA=020420&colorB=00DC82)](https://npmjs.com/package/nuxt-arpix-email-sender)
[![npm downloads](https://img.shields.io/npm/dm/nuxt-arpix-email-sender.svg?style=flat&colorA=020420&colorB=00DC82)](https://npm.chart.dev/nuxt-arpix-email-sender)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Nuxt](https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js)](https://nuxt.com)

A Nuxt module for sending emails using various transport methods with Handlebars template support.

## Features

- Send emails with Handlebars templates
- Support for multiple transport methods (SMTP, AWS SES, Sendmail, Stream)
- Easy configuration through Nuxt config
- Built-in support for development and production environments
- File attachments support
- DKIM signature support for SMTP 🧪 *(Experimental)*
- Connection pooling for high-volume email sending 🧪 *(Experimental)*
- Rate limiting and connection management for AWS SES
- Development-friendly stream transport for testing

## Installation

Install the module to your Nuxt application with one command (requires Nuxi):

```bash
npx nuxi module add nuxt-arpix-email-sender
```

This command will:
- Install the module as a dependency
- Add it to your package.json
- Update your `nuxt.config.ts` file automatically

> **Note for AWS SES Users**: If you're using AWS SES as the transport method, you'll need to install the AWS SDK for SES V2 separately:
> ```bash
> npm install @aws-sdk/client-sesv2
> ```

## Configuration

Configure the module in your `nuxt.config.ts` file:

### SMTP Configuration

#### Standard SMTP Example

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  arpixEmailSender: {
    transport: 'smtp',
    defaultFrom: 'Your Name <noreply@example.com>',
    
    // SMTP configuration (required if transport is 'smtp')
    smtp: {
      host: process.env.EMAIL_SENDER_SMTP_HOST,
      port: Number(process.env.EMAIL_SENDER_SMTP_PORT) || 587,
      secure: false, // or true if using SSL/TLS
      auth: {
        user: process.env.EMAIL_SENDER_SMTP_USER,
        pass: process.env.EMAIL_SENDER_SMTP_PASS,
      }
    },
    
    // DKIM configuration (optional)
    dkim: {
      domainName: 'example.com',
      keySelector: 'default',
      privateKey: process.env.DKIM_PRIVATE_KEY,
      headerFieldNames: 'from:to:subject:date:message-id'
    },
    
    // Connection pooling (optional)
    pool: {
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 10
    },
    
    // Templates configuration (optional)
    templates: {
      dir: 'server/emails/templates', // Directory for Handlebars templates
    },
  },
});
```

#### Gmail Example

**Option 1: App Password (Recommended for development)**

For Gmail with App Password, you'll need to:
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use App Password as your SMTP password

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  arpixEmailSender: {
    transport: 'smtp',
    defaultFrom: 'Your Name <your-email@gmail.com>',
    
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'your-email@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
      }
    },
    
    templates: {
      dir: 'server/emails/templates',
    },
  },
});
```

**Option 2: OAuth2 (Recommended for production)**

For Gmail with OAuth2 authentication, you'll need to:
1. Create a project in Google Cloud Console
2. Enable Gmail API
3. Create OAuth2 credentials
4. Configure consent screen
5. Get refresh token for your application

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  arpixEmailSender: {
    transport: 'smtp',
    defaultFrom: '"Your App Name" <your-email@gmail.com>',
    
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
  },
});
```

**Environment Variables for Gmail OAuth2:**
```bash
EMAIL_USER=your-email@gmail.com
GMAIL_CLIENT_ID=your-oauth2-client-id
GMAIL_CLIENT_SECRET=your-oauth2-client-secret
GMAIL_REFRESH_TOKEN=your-oauth2-refresh-token
```

**Environment Variables for Gmail App Password:**
```bash
GMAIL_APP_PASSWORD=your-16-character-app-password
```

### AWS SES Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  arpixEmailSender: {
    transport: 'ses',
    defaultFrom: 'Your Name <noreply@example.com>',
    
    // SES configuration (required if transport is 'ses')
    ses: {
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
      // Optional: Rate limiting and connection management
      sendingRate: 14, // emails per second
      maxConnections: 5
    },
    
    // Templates configuration (optional)
    templates: {
      dir: 'server/emails/templates',
    },
  },
});
```

### Sendmail Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  arpixEmailSender: {
    transport: 'sendmail',
    defaultFrom: 'Your Name <noreply@example.com>',
    
    // Sendmail configuration (optional)
    sendmail: {
      path: '/usr/sbin/sendmail', // Default sendmail path
      args: ['-i', '-f', 'noreply@example.com'], // Optional arguments
      newline: 'unix' // or 'windows'
    },
    
    // Templates configuration (optional)
    templates: {
      dir: 'server/emails/templates',
    },
  },
});
```

### Stream Configuration (Development)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  arpixEmailSender: {
    transport: 'stream',
    defaultFrom: 'Your Name <noreply@example.com>',
    
    // Stream configuration (optional)
    stream: {
      buffer: true, // Buffer the output
      newline: 'unix' // or 'windows'
    },
    
    // Templates configuration (optional)
    templates: {
      dir: 'server/emails/templates',
    },
  },
});
```

## Usage

### In Server Routes

Use the `useMailSender()` utility in your server routes:

```typescript
// server/api/send-email.post.ts
export default defineEventHandler(async (event) => {
  const sender = useMailSender()
  
  try {
    const info = await sender.send({
      to: 'user@example.com',
      subject: 'Welcome to our platform!',
      template: 'welcome', // Uses welcome.hbs from your templates directory
      context: {
        userName: 'John Doe',
        activationLink: 'https://example.com/activate',
      },
      attachments: [
        {
          filename: 'welcome-guide.pdf',
          content: fs.readFileSync('/path/to/welcome-guide.pdf'),
          // path: '/path/to/welcome-guide.pdf', // Alternatively, you can use a path
        },
      ],
    })
    
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error: error.message }
  }
})
```

### Creating Templates

Create Handlebars templates in your templates directory:

```handlebars
<!-- server/emails/templates/welcome.hbs -->
<h1>Welcome, {{userName}}!</h1>
<p>Thank you for joining our platform.</p>
<p>Please <a href="{{activationLink}}">click here</a> to activate your account.</p>
```

### Stream Transport for Testing

The stream transport is perfect for development and testing:

```typescript
// In development, emails will be logged to console
// With stream transport, you can save emails to files for inspection

const info = await sender.send({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<p>This is a test email</p>'
})

// Email content is available in info.message for inspection
console.log('Email content:', info.message.toString())
```

## Advanced Features

### DKIM Signatures

Add DKIM signatures to improve email deliverability:

```typescript
// Configuration in nuxt.config.ts
dkim: {
  domainName: 'yourdomain.com',
  keySelector: 'default',
  privateKey: fs.readFileSync('./private.key', 'utf8'),
  headerFieldNames: 'from:to:subject:date:message-id' // Optional: specify which headers to sign
}
```

### Connection Pooling

Optimize for high-volume email sending:

```typescript
// Configuration in nuxt.config.ts
pool: {
  maxConnections: 10, // Maximum concurrent connections
  maxMessages: 200, // Messages per connection
  rateDelta: 500, // Time window in ms
  rateLimit: 20 // Messages per time window
}
```

### AWS SES Rate Limiting

Control sending rate and connections for AWS SES:

```typescript
// Configuration in nuxt.config.ts
ses: {
  region: 'us-east-1',
  sendingRate: 10, // Max emails per second
  maxConnections: 5, // Max concurrent connections
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
}
```

## Contribution

<details>
  <summary>Local development</summary>

  ```bash
  # Install dependencies
  npm install

  # Generate type stubs
  npm run dev:prepare

  # Develop with the playground
  npm run dev

  # Build the playground
  npm run dev:build

  # Run ESLint
  npm run lint

  # Run Vitest
  npm run test
  npm run test:watch

  # Release new version
  npm run release
  ```

</details>

## License

[GPL-3.0 License](LICENSE)