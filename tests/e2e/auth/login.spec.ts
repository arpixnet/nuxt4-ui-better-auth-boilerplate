import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('should show login form with required fields', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Check for email input
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    
    // Check for password input
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
    
    // Check for submit button
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    
    // Try to submit
    await page.click('button[type="submit"]')
    
    // Should show validation error
    const errorMessage = page.locator('text=/valid email/i')
    await expect(errorMessage).toBeVisible()
  })

  test('should disable submit button when form is invalid', async ({ page }) => {
    await page.goto('/auth/login')
    
    const submitButton = page.locator('button[type="submit"]')
    
    // Button should be disabled initially
    await expect(submitButton).toBeDisabled()
    
    // Fill only email
    await page.fill('input[type="email"]', 'test@example.com')
    await expect(submitButton).toBeDisabled()
    
    // Fill password with less than 8 characters
    await page.fill('input[type="password"]', 'pass')
    await expect(submitButton).toBeDisabled()
    
    // Fill valid password
    await page.fill('input[type="password"]', 'password123')
    await expect(submitButton).not.toBeDisabled()
  })

  test('should have link to register page', async ({ page }) => {
    await page.goto('/auth/login')
    
    const registerLink = page.locator('a[href="/auth/register"]')
    await expect(registerLink).toBeVisible()
  })

  test('should have link to forgot password page', async ({ page }) => {
    await page.goto('/auth/login')
    
    const forgotPasswordLink = page.locator('a[href="/auth/forgot-password"]')
    await expect(forgotPasswordLink).toBeVisible()
  })
})
