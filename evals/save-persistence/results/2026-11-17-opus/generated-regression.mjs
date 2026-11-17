import { test, expect } from '@playwright/test';

// Journey `profile-save` in docs/verification/app-flows.json:
// open -> edit -> save -> reload. The action under test is performed only
// through the visible form; the API is used solely as a separate read path.
test('saving a display name shows confirmation and persists after reload', async ({ page, request }) => {
  const newName = `Playwright Name ${Date.now()}`;
  const input = page.getByRole('textbox', { name: 'Display name' });
  let originalName;

  await test.step('open: current name is displayed', async () => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    await expect(input).not.toHaveValue('');
    originalName = await input.inputValue();
    expect(originalName).not.toBe(newName);
  });

  try {
    await test.step('edit: new name is in the input', async () => {
      await input.fill(newName);
      await expect(input).toHaveValue(newName);
    });

    await test.step('save: confirmation appears and GET returns the new name', async () => {
      const post = page.waitForResponse(r => r.url().endsWith('/api/profile') && r.request().method() === 'POST');
      await page.getByRole('button', { name: 'Save' }).click();
      expect((await post).ok()).toBe(true);
      await expect(page.getByRole('status')).toHaveText('Saved');
      const saved = await request.get('/api/profile');
      expect(saved.ok()).toBe(true);
      expect(await saved.json()).toEqual(expect.objectContaining({ name: newName }));
    });

    await test.step('reload: new name remains visible', async () => {
      await page.reload();
      await expect(input).toHaveValue(newName);
    });
  } finally {
    // Restore the disposable profile through the public API so reruns start clean.
    if (originalName) await request.post('/api/profile', { data: { name: originalName } });
  }
});

// Journey `profile-save-rejected`: open -> edit -> save-blank (failure branch).
test('saving a blank display name is rejected and leaves the saved name unchanged', async ({ page, request }) => {
  const input = page.getByRole('textbox', { name: 'Display name' });
  const before = await (await request.get('/api/profile')).json();

  await page.goto('/');
  await expect(input).toHaveValue(before.name);

  await input.fill('   ');
  await expect(input).toHaveValue('   ');

  const post = page.waitForResponse(r => r.url().endsWith('/api/profile') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save' }).click();
  expect((await post).status()).toBe(400);
  await expect(page.getByRole('status')).toHaveText('Save failed');

  const after = await request.get('/api/profile');
  expect(await after.json()).toEqual(before);
});
