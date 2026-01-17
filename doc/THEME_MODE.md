# Theme Mode Configuration

## Overview

The application supports three theme modes configured via the `THEME_MODE` environment variable:

- **`toggle`** (default): Users can toggle between light and dark themes, preference is saved to localStorage
- **`light`**: Light theme is forced, no toggle button is shown
- **`dark`**: Dark theme is forced, no toggle button is shown

## Configuration

### Environment Variable

Set the `THEME_MODE` variable in your `.env` file:

```bash
THEME_MODE=toggle  # Default: users can toggle themes
# THEME_MODE=light  # Force light theme
# THEME_MODE=dark   # Force dark theme
```

### Example .env

```env
# Theme Mode Configuration
# Options: toggle, light, dark
THEME_MODE=toggle

# Other configuration...
```

## How It Works

### Toggle Mode (`THEME_MODE=toggle`)

1. A toggle button appears in the header (sun/moon icon)
2. Users can click to switch between light and dark themes
3. Theme preference is automatically saved to `localStorage`
4. Preference persists across page reloads and sessions

### Forced Light Mode (`THEME_MODE=light`)

1. The toggle button is hidden from the UI
2. Light theme is forced on page load
3. Any attempts to change the theme are automatically reverted
4. `localStorage` preference is set to `'light'`

### Forced Dark Mode (`THEME_MODE=dark`)

1. The toggle button is hidden from the UI
2. Dark theme is forced on page load
3. Any attempts to change the theme are automatically reverted
4. `localStorage` preference is set to `'dark'`

## Implementation Details

### Files Involved

- `nuxt.config.ts` - Main configuration with `THEME_MODE` detection
- `app.config.ts` - App-level configuration for theme mode
- `app/plugins/theme-force.client.ts` - Plugin that forces themes in forced modes and clears localStorage
- `app/components/layout/themeSelector.vue` - Toggle button component
- `app/components/layout/AppHeader.vue` - Header that includes the theme selector
- `i18n/locales/es.json` - Spanish translations
- `i18n/locales/en.json` - English translations

### Component Implementation

The `ThemeSelector` component:
- Uses `useRuntimeConfig().public.themeMode` to read the configured mode
- Only renders the toggle button when `THEME_MODE=toggle`
- Uses `@nuxtjs/color-mode` composable for theme management
- Supports internationalization with `changeTheme` translation key

### Plugin Implementation

The `theme-force.client.ts` plugin:
- Runs only on the client side
- Checks if `THEME_MODE` is `'light'` or `'dark'`
- Forces the theme and watches for changes
- Reverts any attempts to change the theme in forced modes

## Translations

### Spanish (`i18n/locales/es.json`)

```json
{
  "common": {
    "changeTheme": "Cambiar Tema"
  }
}
```

### English (`i18n/locales/en.json`)

```json
{
  "common": {
    "changeTheme": "Change Theme"
  }
}
```

## Usage Examples

### Production Deployment with Forced Dark Theme

```env
THEME_MODE=dark
```

### Development with Theme Toggle

```env
THEME_MODE=toggle
```

### Accessibility Compliance with Light Theme

```env
THEME_MODE=light
```

## Nuxt Color Mode Configuration

The `@nuxtjs/color-mode` module is configured in `nuxt.config.ts`:

```typescript
const themeMode = process.env.THEME_MODE || 'toggle'
const colorModePreference = themeMode === 'light' 
  ? 'light' 
  : themeMode === 'dark' 
    ? 'dark' 
    : 'system'

export default defineNuxtConfig({
  colorMode: {
    preference: colorModePreference,
    fallback: 'light',
    classSuffix: ''
  }
})
```

## Troubleshooting

### Toggle Button Not Showing

Check that `THEME_MODE` is set to `'toggle'` in your `.env` file and restart the dev server.

### Theme Not Changing

Clear browser `localStorage` for `'nuxt-color-mode'` key and reload the page.

### Theme Reverting After Change

Verify `THEME_MODE` is not set to `'light'` or `'dark'` (forced modes will revert any changes).
