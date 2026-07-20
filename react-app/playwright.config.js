import process from 'process';
import { defineConfig, devices } from '@playwright/test';

const previewPort = process.env.PLAYWRIGHT_PORT || '4173';
const previewUrl = `http://127.0.0.1:${previewPort}`;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? [['html'], ['list']] : 'list',
	use: {
		baseURL: previewUrl,
		trace: 'on-first-retry',
	},
	webServer: {
		command: `npm run preview -- --host 127.0.0.1 --port ${previewPort}`,
		url: previewUrl,
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
	projects: [
		{ name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
	],
});
