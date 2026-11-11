import { test, expect } from '@playwright/test';
test('profile page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {name: 'Profile'})).toBeVisible();
  await expect(page.getByRole('textbox', {name: 'Display name'})).not.toHaveValue('');
});
