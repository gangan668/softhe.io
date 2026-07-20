import process from 'process';
import { createServer } from 'node:net';
import { defineConfig, devices } from '@playwright/test';

const allocatePort = () => new Promise((resolve, reject) => {
	const server = createServer();
	server.once('error', reject);
	server.listen(0, '127.0.0.1', () => {
		const { port } = server.address();
		server.close((error) => error ? reject(error) : resolve(String(port)));
	});
});

const previewPort = process.env.PLAYWRIGHT_PORT || await allocatePort();
process.env.PLAYWRIGHT_PORT = previewPort;
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
		reuseExistingServer: false,
		timeout: 120000,
	},
	projects: [
		{ name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
	],
});
