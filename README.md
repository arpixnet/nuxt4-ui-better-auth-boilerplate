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
- 🗃️ **SQLite Database** - Lightweight database with better-sqlite3
- 🔧 **Development Tools** - Nuxt DevTools enabled for better DX

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
