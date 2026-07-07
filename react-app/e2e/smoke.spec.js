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
});
