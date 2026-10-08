import { Buffer } from 'node:buffer';
import { expect, test } from '@playwright/test';

const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'customer@example.test', email_confirmed_at: '2026-10-01T12:00:00Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: '2026-10-01T12:00:00Z' };
const jwt = (assurance = 'aal1') => [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, aal: assurance, session_id: 'fixture-session' })).toString('base64url'), 'fixture-signature'].join('.');
async function fixture(page, { loginFails = false, staff = false } = {}) {
	const state = { profile: { id: user.id, full_name: 'Fixture Customer', billing_address: {} }, tickets: [], messages: [], writes: [] };
	await page.addInitScript(() => localStorage.setItem('softhe_analytics_consent', 'false'));
	await page.route('https://portal-fixture.supabase.co/**', async (route) => {
		const request = route.request(); const url = new URL(request.url());
		let body;
		if (url.pathname === '/auth/v1/token') {
			if (loginFails) return route.fulfill({ status: 400, json: { code: 'invalid_credentials', message: 'Invalid login credentials' } });
			body = { access_token: jwt(staff ? 'aal2' : 'aal1'), refresh_token: 'fixture-refresh-token', expires_in: 3600, token_type: 'bearer', user };
		} else if (url.pathname === '/auth/v1/user') body = user;
		else if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, body: '' });
		else if (url.pathname === '/rest/v1/profiles') {
			if (request.method() === 'PATCH') { state.profile = { ...state.profile, ...request.postDataJSON() }; return route.fulfill({ status: 204, body: '' }); }
			body = state.profile;
		} else if (url.pathname === '/rest/v1/tickets') body = state.tickets;
		else if (url.pathname === '/rest/v1/ticket_messages') body = state.messages;
		else if (url.pathname.startsWith('/rest/v1/')) body = [];
		else return route.fulfill({ status: 404, json: { error: 'Unhandled fixture request' } });
		return route.fulfill({ status: 200, json: body });
	});
	await page.route('**/api/staff?**', (route) => {
		if (!staff) return route.fulfill({ status: 403, json: { error: 'Staff access denied', authorized: false } });
		const action = new URL(route.request().url()).searchParams.get('action');
		const payload = route.request().method() === 'POST' ? route.request().postDataJSON() : null;
		let body;
		if (action === 'status' && payload) { state.tickets[0].status = payload.status; body = { updated: true }; }
		else if (action === 'status') body = { authorized: true, mfa: 'aal2', role: 'admin', expiresAt: '2027-01-01', sessions: [{}] };
		else if (action === 'queue') body = { tickets: state.tickets };
		else if (action === 'orders') body = { orders: [{ id: 'layout-order', customer_email: user.email, status: 'paid', amount_total: 2500, currency: 'eur' }] };
		else if (action === 'customers') body = { customers: [{ id: user.id }] };
		else if (action === 'ticket') body = { ticket: state.tickets[0], messages: state.messages };
		else if (action === 'reply') { state.messages.push({ id: 'staff-reply', author_id: user.id, body: payload.message }); body = { saved: true }; }
		else body = {};
		return route.fulfill({ status: 200, json: body });
	});
	await page.route('**/api/ticket-notification', (route) => route.fulfill({ status: 200, json: { sent: true } }));
	await page.route('**/api/tickets/write', (route) => {
		const payload = route.request().postDataJSON(); state.writes.push(payload);
		if (payload.action === 'create') { state.tickets.push({ id: 'fixture-ticket', subject: payload.subject, status: 'open' }); state.messages.push({ id: 'fixture-initial', author_id: user.id, body: payload.message, created_at: '2026-10-01T12:00:00Z' }); }
		else state.messages.push({ id: 'fixture-reply', author_id: user.id, body: payload.message, created_at: '2026-10-01T12:01:00Z' });
		return route.fulfill({ status: 200, json: { id: payload.action === 'create' ? 'fixture-ticket' : 'fixture-reply' } });
	});
	return state;
}
async function login(page) {
	await page.goto('/login');
	await page.getByLabel('Email', { exact: true }).fill(user.email);
	await page.getByLabel('Password', { exact: true }).fill('FixturePassword123!');
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Hello, Fixture Customer' })).toBeVisible();
}
test('portal login, profile persistence, ticket history and signout', async ({ page }) => {
	const state = await fixture(page);
	await login(page);
	await page.getByLabel('Full name', { exact: true }).fill('Updated Fixture');
	await page.getByLabel('City', { exact: true }).fill('Berlin');
	await page.getByRole('button', { name: 'Save profile' }).click();
	await expect(page.getByRole('heading', { name: 'Hello, Updated Fixture' })).toBeVisible();
	expect(state.profile.billing_address.city).toBe('Berlin');
	await page.getByRole('button', { name: 'tickets', exact: true }).click();
	await page.getByRole('button', { name: 'New ticket' }).click();
	await page.getByLabel('Subject', { exact: true }).fill('Fixture support request');
	await page.getByLabel('Message', { exact: true }).fill('Fixture initial message');
	await page.getByRole('button', { name: 'Create ticket' }).click();
	await page.getByRole('button', { name: /Fixture support request/ }).click();
	await expect(page.getByText('Fixture initial message', { exact: true })).toBeVisible();
	await page.getByLabel('Reply', { exact: true }).fill('Fixture follow up');
	await page.getByRole('button', { name: 'Send reply' }).click();
	await expect(page.getByText('Fixture follow up', { exact: true })).toBeVisible();
	expect(state.writes.map((write) => write.action)).toEqual(['create', 'message']);
	await page.getByRole('button', { name: 'Sign out', exact: true }).click();
	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
	await page.goto('/account');
	await expect(page).toHaveURL(/\/login$/);
});
test('customer session cannot open staff operations', async ({ page }) => {
	await fixture(page); await login(page);
	await page.goto('/admin');
	await expect(page).toHaveURL(/\/account$/);
	await expect(page.getByRole('heading', { name: 'Customer operations' })).toHaveCount(0);
});
test('invalid login remains recoverable and private routes stay protected', async ({ page }) => {
	await fixture(page, { loginFails: true });
	await page.goto('/account');
	await expect(page).toHaveURL(/\/login$/);
	await page.getByLabel('Email', { exact: true }).fill(user.email);
	await page.getByLabel('Password', { exact: true }).fill('FixturePassword123!');
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
	await expect(page.getByRole('alert')).toHaveText('Sign-in could not be completed. Check your details and try again.');
	await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled();
	await expect(page).toHaveURL(/\/login$/);
});



const layoutWidths = [320, 390, 768, 1280, 1440];
async function checkLayout(page, width, state, evidence) {
	const metrics = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, pageWidth: document.documentElement.scrollWidth, outsideViewport: Array.from(document.querySelectorAll('main *')).filter((element) => { const rect = element.getBoundingClientRect(); return rect.width && rect.right > document.documentElement.clientWidth + 1; }).map((element) => ({ tag: element.tagName, class: element.className, right: element.getBoundingClientRect().right, width: element.getBoundingClientRect().width })).slice(0, 12), mainCount: document.querySelectorAll('main').length, headingCount: document.querySelectorAll('main h1').length }));
	evidence.push({ width, state, ...metrics });
	if (metrics.pageWidth > metrics.viewport + 1) console.log(JSON.stringify({ width, state, ...metrics }));
	expect(metrics.pageWidth, state + ' at ' + width + 'px').toBeLessThanOrEqual(metrics.viewport + 1);
	expect(metrics.mainCount).toBe(1); expect(metrics.headingCount).toBe(1);
}
test('authenticated account layouts preserve profile and ticket controls at all audit widths', async ({ page }, testInfo) => {
	const state = await fixture(page);
	state.tickets.push({ id: 'layout-ticket', subject: 'Responsive account conversation', status: 'open' });
	state.messages.push({ id: 'layout-message', author_id: user.id, body: 'Customer conversation with a readable message at every viewport.', created_at: '2026-10-01T12:00:00Z' });
	await login(page); const evidence = [];
	for (const width of layoutWidths) {
		await page.setViewportSize({ width, height: 900 });
		await page.getByRole('button', { name: 'overview', exact: true }).click();
		await expect(page.getByLabel('Full name', { exact: true })).toBeVisible(); await checkLayout(page, width, 'account-profile', evidence);
		await page.getByRole('button', { name: 'tickets', exact: true }).click();
		await page.getByRole('button', { name: /Responsive account conversation/ }).click();
		await expect(page.getByLabel('Reply', { exact: true })).toBeVisible(); await checkLayout(page, width, 'account-conversation', evidence);
		await page.getByRole('button', { name: 'New ticket' }).click();
		await expect(page.getByLabel('Subject', { exact: true })).toBeVisible(); await checkLayout(page, width, 'account-ticket-composer', evidence);
		await page.getByRole('button', { name: 'Cancel', exact: true }).click();
		await testInfo.attach('account-' + width + '.png', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
	}
	await page.getByLabel('Reply', { exact: true }).fill('Responsive customer reply'); await page.getByRole('button', { name: 'Send reply' }).click(); await expect(page.getByText('Responsive customer reply', { exact: true })).toBeVisible();
	await testInfo.attach('authenticated-account-layouts.json', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
});
test('verified staff layouts preserve queue, orders, status and reply controls at all audit widths', async ({ page }, testInfo) => {
	const state = await fixture(page, { staff: true });
	state.tickets.push({ id: 'staff-layout-ticket', subject: 'Responsive staff conversation', status: 'open', owner: { email: user.email } });
	state.messages.push({ id: 'staff-layout-message', author_id: 'customer', body: 'Customer message for staff layout verification.' });
	await login(page); await page.goto('/admin');
	await expect(page.getByRole('heading', { name: 'Customer operations' })).toBeVisible(); await expect(page.getByText(user.email, { exact: true })).toBeVisible(); const evidence = [];
	for (const width of layoutWidths) {
		await page.setViewportSize({ width, height: 900 }); await checkLayout(page, width, 'admin-queue-and-orders', evidence);
		await page.getByRole('button', { name: /Responsive staff conversation/ }).click();
		await expect(page.getByRole('combobox', { name: 'Ticket status' })).toBeVisible(); await expect(page.getByRole('button', { name: 'Reply as staff' })).toBeVisible(); await checkLayout(page, width, 'admin-conversation-and-actions', evidence);
		await testInfo.attach('admin-' + width + '.png', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
	}
	await page.getByRole('combobox', { name: 'Ticket status' }).selectOption('in_progress'); await expect(page.getByRole('combobox', { name: 'Ticket status' })).toHaveValue('in_progress');
	await page.locator('.conversation textarea').fill('Responsive staff reply'); await page.getByRole('button', { name: 'Reply as staff' }).click(); await expect(page.getByText('Responsive staff reply', { exact: true })).toBeVisible();
	await testInfo.attach('authenticated-admin-layouts.json', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
});


