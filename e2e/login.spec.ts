import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('/');
  await page.fill('[name="email"]', 'admin@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});

test('member management', async ({ page }) => {
  await page.goto('/members');
  await page.click('button:has-text("Add Member")');
  await page.fill('[name="name"]', 'John Doe');
  await page.fill('[name="phone"]', '0244123456');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=John Doe')).toBeVisible();
});

test('SMS broadcast', async ({ page }) => {
  await page.goto('/broadcast');
  await page.fill('[name="message"]', 'Test broadcast message');
  await page.click('button:has-text("Send")');
  await expect(page.locator('text=Message sent successfully')).toBeVisible();
});