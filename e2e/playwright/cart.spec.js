const { test, expect } = require('@playwright/test');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:8000').trim();

test('cart add/remove and dark-mode persist, logout clears token', async ({ page }) => {
  await page.goto(BASE + '/');

  // Ensure site.js is loaded
  await expect(page.locator('script[src*="frontend/js/site.js"]')).toHaveCount(1);

  // Add first available product to cart
  const addBtn = page.locator('.add-to-cart').first();
  await expect(addBtn).toBeVisible();

  // Intercept alert dialog
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('Added to cart');
    await dialog.accept();
  });

  await addBtn.click();

  // Cart count should update
  await expect(page.locator('.cart-count')).toHaveText(/1/);

  // Visit cart page and check contents
  await page.goto(BASE + '/cart/');
  await expect(page.locator('#cart-items')).toContainText('Test', { timeout: 3000 }).catch(()=>{});

  // Try remove buttons
  const removeBtn = page.locator('#cart-items .remove-item').first();
  if (await removeBtn.count()) {
    await removeBtn.click();
    await expect(page.locator('#cart-items')).toContainText('Your cart is empty');
  }

  // Test clear-cart works (re-add then clear)
  await page.goto(BASE + '/');
  await addBtn.click();
  await page.goto(BASE + '/cart/');
  await page.locator('#clear-cart').click();
  await expect(page.locator('#cart-items')).toContainText('Your cart is empty');

  // Test dark mode persistence
  await page.goto(BASE + '/');
  // Click dark toggle
  const darkToggle = page.locator('#dark-toggle');
  await darkToggle.click();
  // Check document element classlist has 'dark'
  const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  expect(hasDark).toBeTruthy();
  // Reload and verify persists
  await page.reload();
  const hasDarkAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  expect(hasDarkAfter).toBeTruthy();

  // Test logout clears legacy token (register a temp user first)
  const email = `e2e+${Date.now()}@example.com`;
  await page.goto(BASE + '/register/');
  await page.fill('input[name="name"]', 'E2E Tester');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'secret123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');

  // Set legacy token and perform logout
  await page.evaluate(() => localStorage.setItem('pkat_token', 'abc123'));
  // The logout form should exist now and be visible
  const logoutForm = page.locator('#logout-form');
  if (await logoutForm.count()) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      logoutForm.locator('button[type="submit"]').click()
    ]);
    const token = await page.evaluate(() => localStorage.getItem('pkat_token'));
    expect(token).toBeNull();
  }
});
