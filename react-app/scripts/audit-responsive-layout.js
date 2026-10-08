import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const baseUrl = process.argv[2];
const outputDirectory = process.argv[3];
if (!baseUrl || !outputDirectory) throw new Error('Usage: node scripts/audit-responsive-layout.js <preview-url> <output-directory>');
const widths = [320, 390, 768, 1280, 1440];
const routes = ['/', '/services', '/store', '/performance', '/contact', '/faq', '/privacy-policy', '/cookie-policy', '/terms', '/legal-notice', '/withdrawal', '/checkout', '/login', '/register', '/forgot-password', '/resend-confirmation', '/reset-password', '/account', '/admin', '/audit-missing-route'];
const directory = path.resolve(outputDirectory);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
	for (const width of widths) {
		const context = await browser.newContext({ viewport: { width, height: 900 } });
		await context.addInitScript(() => localStorage.setItem('softhe_analytics_consent', 'false'));
		const page = await context.newPage();
		for (const route of routes) {
			const response = await page.goto(new URL(route, baseUrl).href);
			await page.locator('main h1, main .portal-state, main .portal-error').first().waitFor({ state: 'visible' });
			await page.evaluate(() => document.fonts.ready);
			const layout = await page.evaluate(() => ({
				viewport: innerWidth,
				pageWidth: document.documentElement.scrollWidth,
				horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
				mainCount: document.querySelectorAll('main').length,
				primaryNavigationCount: document.querySelectorAll('nav[aria-label="Primary navigation"]').length,
				footerCount: document.querySelectorAll('footer').length,
				headings: Array.from(document.querySelectorAll('main h1')).map((element) => element.textContent.trim()),
				outsideViewport: Array.from(document.querySelectorAll('main *')).filter((element) => {
					const rect = element.getBoundingClientRect(); const style = getComputedStyle(element);
					return rect.width && rect.height && style.visibility !== 'hidden' && style.display !== 'none' && (rect.right > innerWidth + 1 || rect.left < -1);
				}).slice(0, 8).map((element) => ({ tag: element.tagName, class: element.className, text: element.textContent.trim().slice(0, 100) })),
			}));
			const passed = response.ok() && !layout.horizontalOverflow && layout.mainCount === 1 && layout.primaryNavigationCount === 1 && layout.footerCount === 1;
			let screenshot;
			if (!passed || ((width === 320 || width === 1440) && ['/', '/store', '/account'].includes(route))) {
				screenshot = path.join(directory, `${width}-${route.replaceAll('/', '-').replace(/^-/, '') || 'home'}.png`);
				await page.screenshot({ path: screenshot, fullPage: true });
			}
			results.push({ width, requestedRoute: route, actualRoute: new URL(page.url()).pathname, status: response.status(), passed, ...layout, screenshot });
		}
		await context.close();
		console.log(`Completed ${width}px: ${results.filter((result) => result.width === width && result.passed).length}/${routes.length} passed.`);
	}
} finally { await browser.close(); }
const report = { generatedAt: new Date().toISOString(), baseUrl, widths, routes, passed: results.every((result) => result.passed), results };
await writeFile(path.join(directory, 'responsive-layout.json'), JSON.stringify(report, null, 2));
console.log(`Saved ${results.length} layout checks to ${path.join(directory, 'responsive-layout.json')}`);
if (!report.passed) process.exitCode = 1;
