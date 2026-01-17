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
3. Theme preference is saved to `localStorage` with key `'arpix_color_mode'`

### Forced Dark Mode (`THEME_MODE=dark`)

1. The toggle button is hidden from the UI
2. Dark theme is forced on page load
3. Theme preference is saved to `localStorage` with key `'arpix_color_mode'`

## Implementation Details

### Files Involved

- `nuxt.config.ts` - Main configuration with `THEME_MODE` detection
- `app.config.ts` - App-level configuration for theme mode
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

## Important: Clearing localStorage

**⚠️ CRITICAL**: Every time you change the `THEME_MODE` configuration, you must clear the `arpix_color_mode` key from browser localStorage for the new theme to take effect.

### How to Clear localStorage

1. Open your browser's Developer Tools (F12 or right-click → Inspect)
2. Go to the **Application** tab
3. In the left sidebar, expand **Local Storage**
4. Click on your domain (e.g., `http://localhost:3000`)
5. Find and delete the `arpix_color_mode` key
6. **Refresh the page** to see the new theme

### Why This Is Necessary

The theme preference is cached in localStorage to persist across page reloads. When you change `THEME_MODE` in your `.env` file, the old cached preference may conflict with the new configuration, preventing the new theme from being applied.

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
    storageKey: 'arpix_color_mode',
    classSuffix: ''
  }
})
```

## Troubleshooting

### Theme Not Changing After Switching THEME_MODE

**Problem**: You changed `THEME_MODE` in your `.env` file, but the theme remains the same.

**Solution**: Follow these steps:

1. **Delete `arpix_color_mode` from localStorage**:
   - Open Developer Tools (F12 or right-click → Inspect)
   - Go to **Application** tab
   - Expand **Local Storage** in left sidebar
   - Click on your domain (e.g., `http://localhost:3000`)
   - Delete the `arpix_color_mode` key
2. **Refresh the page** (Ctrl+R or Cmd+R)
3. **Restart the dev server** if still not working (stop with Ctrl+C, then `npm run dev`)

**Why This Happens**: The old theme preference is cached in localStorage and persists even when you change the configuration in `.env`.

### Toggle Button Not Showing

Check that `THEME_MODE` is set to `'toggle'` in your `.env` file and restart the dev server.

### Theme Reverting After Change in Toggle Mode

If you're in toggle mode and the theme keeps reverting:
- Check that `THEME_MODE` is set to `'toggle'` (not `'light'` or `'dark'`)
- Clear `arpix_color_mode` from localStorage
- Refresh the page

### Wrong Theme on First Load After Server Restart

After restarting the dev server with a new `THEME_MODE`:
1. Clear `arpix_color_mode` from localStorage
2. Refresh the page
3. The new theme should now apply correctly
