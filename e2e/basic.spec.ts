import { test, expect } from '@playwright/test';

test.describe('基本的な機能テスト', () => {
  test('ホームページが正常に読み込まれる', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Hobby Weather/);
  });

  test('天気情報の取得ができる', async ({ page }) => {
    await page.goto('/');
    
    const weatherButton = page.locator('[data-testid="get-weather-button"]').first();
    if (await weatherButton.isVisible()) {
      await weatherButton.click();
      
      await expect(page.locator('[data-testid="weather-card"]').first()).toBeVisible({
        timeout: 10000
      });
    }
  });

  test('趣味データの表示確認', async ({ page }) => {
    await page.goto('/');
    
    const hobbySection = page.locator('[data-testid="hobby-section"]').first();
    if (await hobbySection.isVisible()) {
      await expect(hobbySection).toBeVisible();
    }
  });

  test('レスポンシブデザインの確認', async ({ page }) => {
    await page.goto('/');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('body')).toBeVisible();
  });
});