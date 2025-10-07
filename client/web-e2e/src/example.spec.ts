import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect at least one h1 to contain 'Welcome'
  const h1Texts = await page.locator('h1').allInnerTexts();
  expect(h1Texts.some(text => text.includes('Welcome'))).toBe(true);
});
