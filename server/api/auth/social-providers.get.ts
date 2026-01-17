/**
 * Get Available Social Providers
 * 
 * This endpoint returns the list of configured social providers
 * based on SOCIAL_PROVIDER_* environment variables.
 * 
 * The frontend uses this to dynamically show only the providers
 * that are actually configured.
 */
export default defineEventHandler(async (event) => {
  // Find all SOCIAL_PROVIDER_* environment variables
  const providerVars = Object.keys(process.env)
    .filter(key => key.startsWith('SOCIAL_PROVIDER_'))
  
  // Group variables by provider name and check if they have credentials
  const providersMap: Record<string, boolean> = {}
  
  for (const varName of providerVars) {
    const value = process.env[varName]
    if (!value || value.trim() === '') continue
    
    // Extract provider name
    // Format: SOCIAL_PROVIDER_GOOGLE_CLIENT_ID
    const parts = varName.split('_')
    const provider = parts[2].toLowerCase()
    
    // Mark provider as having at least one configured variable
    providersMap[provider] = true
  }
  
  // Return array of available provider names
  const availableProviders = Object.keys(providersMap).sort()
  
  return {
    providers: availableProviders,
    count: availableProviders.length
  }
})
