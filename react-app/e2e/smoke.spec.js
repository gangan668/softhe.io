import { expect, test } from '@playwright/test';

const routes = ['/', '/services', '/store', '/performance', '/guides', '/faq', '/contact'];

test.describe('public website smoke tests', () => {
	for (const route of routes) {
		test(`loads ${route}`, async ({ page }) => {
			await page.goto(route);
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
});
