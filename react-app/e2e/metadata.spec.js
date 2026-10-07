import { expect, test } from '@playwright/test';

const privateRoutes = ['/login', '/register', '/forgot-password', '/resend-confirmation', '/reset-password', '/account', '/admin'];
const publicRoutes = ['/', '/services', '/store', '/performance', '/contact', '/faq', '/checkout', '/privacy-policy', '/cookie-policy', '/terms', '/legal-notice', '/withdrawal'];

test('direct hydrated routes keep canonical and indexing policy', async ({ page }) => {
	for (const route of [...publicRoutes, ...privateRoutes]) {
		await page.goto(route);
		await expect(page.locator('h1, .portal-state, .portal-error').first()).toBeVisible();
		const actualPath = new URL(page.url()).pathname;
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://softhe.io${actualPath}`);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', privateRoutes.includes(route) ? 'noindex, nofollow' : 'index, follow');
		await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://softhe.io${actualPath}`);
	}
});

test('SPA transitions restore public metadata after private routes', async ({ page }) => {
	await page.goto('/login');
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
	const menu = page.getByRole('button', { name: 'Open navigation menu' });
	if (await menu.isVisible()) await menu.click();
	await page.locator('nav a[href="/store"]').first().click();
	await expect(page.locator('h1').first()).toBeVisible();
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://softhe.io/store');
	await page.goBack();
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('static 404 retains its layout under strict production CSP', async ({ page }) => {
	const violations = [];
	page.on('console', (message) => {
		if (/violates.*Content Security Policy|Refused to apply inline style/i.test(message.text())) violations.push(message.text());
	});
	await page.route('**/404.html', async (route) => {
		const response = await route.fetch();
		await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': "default-src 'self'; style-src 'self'; object-src 'none'; base-uri 'self'" } });
	});
	await page.goto('/404.html');
	await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
	await expect(page.locator('body')).toHaveCSS('display', 'grid');
	await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(8, 12, 18)');
	await expect(page.getByRole('link', { name: 'Return to Softhe.io' })).toHaveCSS('background-color', 'rgb(75, 225, 195)');
	expect(violations).toEqual([]);
	await page.getByRole('link', { name: 'Return to Softhe.io' }).click();
	await expect(page).toHaveURL(/\/$/);
});

test('unknown SPA routes show the actual not-found content', async ({ page }) => {
	await page.goto('/missing-audit-route');
	await expect(page.getByRole('heading', { name: 'Page Not Found', exact: true })).toBeVisible();
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
	await expect(page.getByRole('link', { name: 'Home', exact: true }).last()).toBeVisible();
});
