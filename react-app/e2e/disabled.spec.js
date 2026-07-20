import { expect, test } from '@playwright/test';

test.describe('fail-closed launch state', () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => localStorage.setItem('softhe_analytics_consent', 'false'));
	});

	test('store keeps ordering controls unavailable and provides a contact path', async ({ page }) => {
		await page.goto('/store');
		await expect(page.getByRole('status').filter({ hasText: 'Online checkout is being prepared' })).toBeVisible();
		await expect(page.getByRole('button', { name: /add to cart/i })).toHaveCount(0);
		await expect(page.getByRole('button', { name: /buy now/i })).toHaveCount(0);
		await expect(page.getByText('Ordering temporarily unavailable')).toHaveCount(3);
		await expect(page.getByRole('link', { name: 'Ask about an order' })).toHaveAttribute('href', '/contact');
	});

	test('contact page replaces the form with direct email support', async ({ page }) => {
		await page.goto('/contact');
		await expect(page.getByLabel('Full Name *')).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Send Message' })).toHaveCount(0);
		await expect(page.getByRole('link', { name: 'Email support' })).toHaveAttribute('href', 'mailto:support@softhe.io');
	});
});
