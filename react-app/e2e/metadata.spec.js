import { expect, test } from '@playwright/test';

const privateRoutes = ['/login', '/register', '/forgot-password', '/resend-confirmation', '/reset-password', '/account', '/admin', '/checkout'];
const publicRoutes = ['/', '/services', '/store', '/performance', '/contact', '/faq', '/privacy-policy', '/cookie-policy', '/terms', '/legal-notice', '/withdrawal'];

// Protected routes show a loading state before redirecting, so metadata is only final once it clears.
const settled = async (page) => {
	await expect(page.locator('h1, .portal-state, .portal-error').first()).toBeVisible();
	await expect(page.locator('.portal-state[role="status"]').filter({ hasText: /^Loading your account…$/ })).toHaveCount(0);
	await expect(page.locator('h1, .portal-error, .portal-state').first()).toBeVisible();
};

test('direct hydrated routes keep canonical and indexing policy', async ({ page }) => {
	for (const route of [...publicRoutes, ...privateRoutes]) {
		await page.goto(route);
		await settled(page);
		const actualPath = new URL(page.url()).pathname;
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://softhe.io${actualPath}`);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', privateRoutes.includes(route) ? 'noindex, nofollow' : 'index, follow');
		await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://softhe.io${actualPath}`);
		// Social platforms do not render SVG previews, so hydrated pages must keep the raster card.
		if (publicRoutes.includes(route)) {
			await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://softhe.io/images/social-share.jpg');
			await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', 'https://softhe.io/images/social-share.jpg');
		}
	}
});

test('static HTML and hydrated pages declare the same copy', async ({ page, request }) => {
	// Reads the live document, or parses served HTML without running any of its scripts.
	const head = (html) => page.evaluate((source) => {
		const doc = source ? new DOMParser().parseFromString(source, 'text/html') : document;
		const value = (selector) => doc.head.querySelector(selector)?.getAttribute('content') ?? null;
		return {
			title: doc.title,
			description: value('meta[name="description"]'),
			ogTitle: value('meta[property="og:title"]'),
			ogDescription: value('meta[property="og:description"]'),
			twitterTitle: value('meta[name="twitter:title"]'),
			twitterDescription: value('meta[name="twitter:description"]'),
		};
	}, html ?? null);
	for (const route of [...publicRoutes, ...privateRoutes]) {
		// Crawlers and link previews read the served file without running the app. Vercel serves each
		// route's generated index.html; vite preview would answer with its SPA fallback, so ask for the file.
		const file = route === '/' ? '/' : `${route}/index.html`;
		const served = await head(await (await request.get(file)).text());
		expect(served.title, route).not.toBe('Softhe.io');
		await page.goto(route);
		await settled(page);
		// Redirects (for example checkout or account) hydrate as a different route and are compared there.
		if (new URL(page.url()).pathname !== route) continue;
		expect(await head(), route).toEqual(served);
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
