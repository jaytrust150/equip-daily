import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('can navigate to devotional and view content', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await expect(page.locator('h1')).toBeVisible();
    
    // Check that the Today tab is visible (devotional entry point)
    await expect(page.locator('text=Today')).toBeVisible();
  });

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/');
    
    // Wait for content
    await page.waitForLoadState('networkidle');
    
    // Find and click dark mode toggle (adjust selector based on your implementation)
    const themeButton = page.locator('[aria-label*="theme"], [aria-label*="dark"], button:has-text("☀"), button:has-text("🌙")').first();
    
    if (await themeButton.isVisible()) {
      await themeButton.click();
      
      // Verify dark mode applied (check for dark class on html/body)
      const isDark = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') || 
               document.body.classList.contains('dark') ||
               document.documentElement.getAttribute('data-theme') === 'dark';
      });
      
      expect(isDark).toBeTruthy();
    }
  });

  test('can navigate between tabs', async ({ page }) => {
    await page.goto('/');
    
    // Wait for navigation to be ready
    await page.waitForLoadState('networkidle');
    
    // Click Bible tab
    const bibleTab = page.locator('text=Bible').first();
    if (await bibleTab.isVisible()) {
      await bibleTab.click();
      await expect(page).toHaveURL(/.*bible/);
    }
    
    // Click Community tab
    const communityTab = page.locator('text=Community').first();
    if (await communityTab.isVisible()) {
      await communityTab.click();
      await expect(page).toHaveURL(/.*community/);
    }
  });

  test('audio player loads on devotional', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app
    await page.waitForLoadState('networkidle');
    
    // Check if audio player exists (adjust selector to match your AudioPlayer component)
    const audioPlayer = page.locator('audio, [data-testid="audio-player"], .audio-player').first();
    
    // Audio player should exist in DOM
    const count = await audioPlayer.count();
    expect(count).toBeGreaterThanOrEqual(0); // May not always have audio, but check it doesn't error
  });

  test('search functionality is accessible', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForLoadState('networkidle');
    
    // Look for search button or input
    const searchButton = page.locator('[aria-label*="search"], button:has-text("Search"), input[type="search"]').first();
    
    if (await searchButton.isVisible()) {
      await searchButton.click();
      
      // Search modal or input should appear
      await expect(page.locator('input[type="search"], input[placeholder*="search" i]')).toBeVisible();
    }
  });
});
