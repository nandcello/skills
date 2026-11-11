import { test, expect } from '@playwright/test';

async function openProfile(page, request) {
  const response = await request.get('/api/profile');
  expect(response.status()).toBe(200);
  const original = await response.json();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Display name' })).toHaveValue(original.name);
  return original;
}

test('display name survives saving, API read and reload', async ({ page, request }) => {
  const original = await openProfile(page, request);
  const name = `${original.name} verified`;
  const input = page.getByRole('textbox', { name: 'Display name' });
  await input.fill(name);
  await expect(input).toHaveValue(name);
  const responsePromise = page.waitForResponse(r => r.url().endsWith('/api/profile') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await responsePromise).status()).toBe(200);
  await expect(page.getByRole('status')).toHaveText('Saved');
  const saved = await request.get('/api/profile');
  expect(saved.status()).toBe(200);
  // Soft assertions retain both independent persistence failures in one run.
  expect.soft(await saved.json(), 'subsequent GET must return saved name').toEqual({ name });
  await page.reload();
  await expect.soft(input, 'saved name must remain after reload').toHaveValue(name);
});

test('empty display name is blocked without mutation', async ({ page, request }) => {
  const original = await openProfile(page, request);
  const posts = [];
  page.on('request', r => { if (r.method() === 'POST') posts.push(r.url()); });
  const input = page.getByRole('textbox', { name: 'Display name' });
  await input.fill('');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  expect(await input.evaluate(element => element.validity.valueMissing)).toBe(true);
  await expect(page.getByRole('status')).toBeEmpty();
  expect(posts).toEqual([]);
  expect(await (await request.get('/api/profile')).json()).toEqual(original);
  await page.reload();
  await expect(input).toHaveValue(original.name);
});

test('whitespace name reports save failure without mutation', async ({ page, request }) => {
  const original = await openProfile(page, request);
  const input = page.getByRole('textbox', { name: 'Display name' });
  await input.fill('   ');
  const responsePromise = page.waitForResponse(r => r.url().endsWith('/api/profile') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await responsePromise).status()).toBe(400);
  await expect(page.getByRole('status')).toHaveText('Save failed');
  expect(await (await request.get('/api/profile')).json()).toEqual(original);
  await page.reload();
  await expect(input).toHaveValue(original.name);
});

test('API rejects invalid name types without mutation', async ({ request }) => {
  const original = await (await request.get('/api/profile')).json();
  for (const payload of [{}, { name: 42 }, { name: '' }, { name: '   ' }]) {
    const response = await request.post('/api/profile', { data: payload });
    expect(response.status()).toBe(400);
    expect(await response.text()).toBe('Name required');
    expect(await (await request.get('/api/profile')).json()).toEqual(original);
  }
});
