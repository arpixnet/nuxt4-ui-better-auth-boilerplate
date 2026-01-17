export default defineNuxtPlugin(() => {
  const colorMode = useColorMode()
  const appConfig = useAppConfig()
  
  // Get forced preference from app config
  const colorModePreference = appConfig.themeMode as 'light' | 'dark' | 'toggle'
  
  // If mode is light or dark (forced), apply it and don't allow changes
  if (colorModePreference === 'light' || colorModePreference === 'dark') {
    // Force theme by setting the value directly
    colorMode.preference = colorModePreference
    colorMode.value = colorModePreference
    
    // Watch for any attempts to change the theme and revert them
    watch(colorMode, (newValue) => {
      if (String(newValue) !== colorModePreference) {
        colorMode.value = colorModePreference
        colorMode.preference = colorModePreference
      }
    })
  }
})
