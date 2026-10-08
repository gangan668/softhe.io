import { expect, test } from '@playwright/test';

// The real installed React SDK injects this same-origin collector fixture.
// It implements the SDK queue/beforeSend/pageview protocol and sends no live analytics.
const collectorScript = `(() => {
  let beforeSend = event => event;
  const receive = (kind, properties) => {
    if (kind === 'beforeSend') { beforeSend = properties; return; }
    if (kind !== 'pageview') return;
    const event = beforeSend({ type: 'pageview', url: new URL(properties?.path || location.href, location.origin).toString() });
    if (event) fetch('/_vercel/insights/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
  };
  const queue = window.vaq || [];
  window.va = receive;
  window.vaq = [];
  queue.forEach(args => receive(...args));
})();`;

const openMenu = async (page) => {
	const menu = page.getByRole('button', { name: 'Open navigation menu' });
	if (await menu.isVisible()) await menu.click();
};

test('Vercel analytics honors consent and sends sanitized fixed public pageviews', async ({ page }) => {
	const events = [];
	const scripts = [];
	await page.addInitScript(() => localStorage.removeItem('softhe_analytics_consent'));
	await page.route('**/_vercel/insights/script.js', async (route) => {
		scripts.push(route.request().url());
		await route.fulfill({ status: 200, contentType: 'application/javascript', body: collectorScript });
	});
	await page.route('**/_vercel/insights/view', async (route) => {
		events.push(route.request().postDataJSON());
		await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
	});
	await page.goto('/store?token=private-token&customer_id=private-id#private-fragment');
	await expect(page.getByRole('button', { name: 'Accept cookies' })).toBeVisible();
	expect(scripts).toEqual([]);
	expect(events).toEqual([]);
	await page.getByRole('button', { name: 'Accept cookies' }).click();
	await expect.poll(() => events.length).toBe(1);
	const origin = new URL(page.url()).origin;
	expect(scripts).toEqual([`${origin}/_vercel/insights/script.js`]);
	expect(events).toEqual([{ type: 'pageview', url: `${origin}/store` }]);
	await expect(page.locator('script[src$="/_vercel/insights/script.js"]')).toHaveAttribute('data-disable-auto-track', '1');

	await openMenu(page);
	await page.locator('nav a[href="/login"]').click();
	await expect(page.getByRole('heading', { name: 'Welcome back', exact: true })).toBeVisible();
	await page.evaluate(() => window.va('pageview', { path: `${location.origin}/account/private-user?access_token=private-token#private-fragment` }));
	expect(events).toHaveLength(1);

	await openMenu(page);
	await page.locator('nav a[href="/services"]').first().click();
	await expect.poll(() => events.length).toBe(2);
	expect(events[1]).toEqual({ type: 'pageview', url: `${origin}/services` });

	await page.getByRole('button', { name: 'Cookie Settings', exact: true }).click();
	await page.getByRole('button', { name: 'Decline cookies' }).click();
	await page.evaluate(() => window.va('pageview', { path: `${location.origin}/store?private-token#private-fragment` }));
	await openMenu(page);
	await page.locator('nav a[href="/store"]').first().click();
	await expect(page.locator('h1').first()).toBeVisible();
	expect(events).toHaveLength(2);
	expect(JSON.stringify(events)).not.toMatch(/private|token|customer_id|#/);
});
