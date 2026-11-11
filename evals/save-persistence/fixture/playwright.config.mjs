import { defineConfig } from '@playwright/test';
const port = process.env.PORT || '4317';
export default defineConfig({
  testDir: './tests', workers: 1, retries: 0,
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure' },
  reporter: [['list'], ['json', {outputFile: 'artifacts/playwright.json'}]],
  webServer: {command: 'npm start', url: `http://127.0.0.1:${port}/health`, reuseExistingServer: false}
});
