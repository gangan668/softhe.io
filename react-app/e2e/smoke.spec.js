import { expect, test } from '@playwright/test';

const routes = ['/', '/services', '/store', '/performance', '/guides', '/faq', '/contact', '/terms', '/privacy-policy', '/legal-notice', '/withdrawal'];

test.describe('public website smoke tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => localStorage.setItem('softhe_analytics_consent', 'false'));
	});

	for (const route of routes) {
			test(`loads ${route}`, async ({ page }) => {
			await page.goto(route);
			await expect(page.locator('meta[name="softhe-app"][content="softhe.io"]')).toHaveCount(1);
			await expect(page.locator('h1').first()).toBeVisible();
			await expect(page.locator('nav')).toBeVisible();
		});
	}

	test('store recommendation and cart path work', async ({ page }) => {
		await page.goto('/store');
		await page.getByRole('button', { name: /newer pc/i }).click();
		await expect(page.getByText('Custom Windows 11 ISO').first()).toBeVisible();
		await page.getByRole('button', { name: /add to cart/i }).first().click();
		await expect(page.getByRole('button', { name: /added to cart/i })).toBeVisible();
	});

	test('unknown route shows the not found page through SPA fallback', async ({ page }) => {
		await page.goto('/this-route-does-not-exist');
		await expect(page.locator('h1').first()).toBeVisible();
	});

	test('skip link and client-side navigation move focus to main content', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.press('Tab');
		const skipLink = page.getByRole('link', { name: /skip to main content/i });
		await expect(skipLink).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page.locator('#main-content')).toBeFocused();

		if ((page.viewportSize()?.width ?? 0) < 768) {
			await page.getByRole('button', { name: /open navigation menu/i }).click();
		}
		await page.locator('nav').getByRole('link', { name: 'Services' }).click();
		await expect(page).toHaveURL(/\/services$/);
		await expect(page.locator('#main-content')).toBeFocused();
	});

	test('checkout requires terms consent and exposes server failures safely', async ({ page }) => {
		await page.route('**/api/create-checkout-session', (route) => route.fulfill({
			status: 503,
			contentType: 'application/json',
			body: JSON.stringify({ error: 'Checkout is unavailable in this test' }),
		}));
		await page.goto('/store');
		await page.getByRole('button', { name: /buy now/i }).first().click();
		const payButton = page.getByRole('button', { name: /pay securely with stripe/i });
		await expect(payButton).toBeDisabled();
		await page.getByRole('checkbox', { name: /agree to the terms/i }).check();
		await expect(payButton).toBeDisabled();
		await page.getByRole('checkbox', { name: /request digital delivery or service preparation/i }).check();
		await payButton.click();
		await expect(page.getByRole('alert')).toContainText('Checkout is unavailable in this test');
	});

	test('contact form handles a successful server response', async ({ page }) => {
		await page.route('**/api/contact', (route) => route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ delivered: true }),
		}));
		await page.goto('/contact');
		await page.getByLabel('Full Name *').fill('Test Customer');
		await page.getByLabel('Email Address *').fill('customer@example.com');
		await page.getByLabel('Subject *').selectOption('general');
		await page.getByLabel('Message *').fill('Please check compatibility for my test system.');
		await page.getByRole('button', { name: 'Send Message' }).click();
		await expect(page.getByRole('status')).toContainText('Thank you for your message');
	});

	test('withdrawal form records a request and shows the acknowledgement', async ({ page }) => {
		await page.route('**/api/withdrawal', (route) => route.fulfill({
			status: 202,
			contentType: 'application/json',
			body: JSON.stringify({ accepted: true, requestId: 'wd_test_123' }),
		}));
		await page.goto('/withdrawal');
		await page.getByLabel('Order reference *').fill('cs_test_order_123');
		await page.getByLabel('Email used for the order *').fill('customer@example.com');
		await page.getByRole('button', { name: /confirm withdrawal request/i }).click();
		await expect(page.getByRole('status')).toContainText('wd_test_123');
	});

	test('mobile navigation is opaque, traps focus, and closes with Escape', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		const menuButton = page.getByRole('button', { name: /open navigation menu/i });
		await menuButton.click();
		const menu = page.locator('#primary-navigation');
		await expect(menu).toBeVisible();
		await expect(menu).toHaveCSS('background-color', 'rgb(8, 10, 15)');
		await expect(menu.getByRole('link', { name: 'Home', exact: true })).toBeFocused();
		await page.keyboard.press('Shift+Tab');
		await expect(menu.getByRole('link', { name: 'FAQ', exact: true })).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(menuButton).toBeFocused();
	});

	for (const width of [320, 390, 768, 1280, 1440]) {
		test(`store has no horizontal overflow at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/store');
			const dimensions = await page.evaluate(() => ({
				scrollWidth: document.documentElement.scrollWidth,
				clientWidth: document.documentElement.clientWidth,
			}));
			expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
		});
	}

	test('checkout status banner starts below the fixed navbar', async ({ page }) => {
		await page.goto('/store?checkout=success');
		const navbarBox = await page.locator('nav').boundingBox();
		const bannerBox = await page.locator('.checkout-result-error').boundingBox();
		expect(navbarBox).not.toBeNull();
		expect(bannerBox).not.toBeNull();
		expect(bannerBox.y).toBeGreaterThanOrEqual(navbarBox.y + navbarBox.height - 1);
	});
});
