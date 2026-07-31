const { fetchWithTimeout } = require('./_lib/fetch');
const { adminRequest, isAdminEmail, verifyActiveUser } = require('./_lib/supabase');
const { persistPaidOrder } = require('./stripe-webhook');
const { acquireLock, enforceRateLimit, jsonOnly, sendPublicError } = require('./_lib/portal-security');

async function portalBackfill(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
		jsonOnly(req);
		const user = await verifyActiveUser(req);
		if (!user.email_confirmed_at || !isAdminEmail(user.email)) return res.status(403).json({ error: 'Staff access required' });
		const role = (await adminRequest(`user_roles?user_id=eq.${encodeURIComponent(user.id)}&select=role,expires_at,revoked_at`))?.[0];
		if (!['staff','admin'].includes(role?.role) || role.revoked_at || new Date(role.expires_at) <= new Date()) return res.status(403).json({ error: 'Staff access required' });
		await enforceRateLimit('backfill:user', user.id, 1, 3600);
		if (!(await acquireLock('stripe-backfill', 1800))) return res.status(409).json({ error: 'A backfill is already running' });
		if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Stripe is not configured' });
		const cursor = typeof req.body?.cursor === 'string' && /^cs_[A-Za-z0-9_]+$/.test(req.body.cursor) ? req.body.cursor : null;
		let url = `https://api.stripe.com/v1/checkout/sessions?limit=100${cursor ? `&starting_after=${encodeURIComponent(cursor)}` : ''}`;
		let scanned = 0; let imported = 0; let skipped = 0;
		let pages = 0; let nextCursor = null;
		do {
			pages += 1;
			const response = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } });
			const page = await response.json();
			if (!response.ok) throw new Error(page.error?.message || 'Stripe history could not be read');
			for (const session of page.data || []) {
				scanned += 1;
				if (!['paid', 'no_payment_required'].includes(session.payment_status) || session.metadata?.order_schema !== '1') { skipped += 1; continue; }
				try { await persistPaidOrder({ id: `backfill:${session.id}`, type: 'portal.backfill' }, session); imported += 1; } catch { skipped += 1; }
			}
			const last = page.data?.at(-1)?.id;
			nextCursor = page.has_more && last ? last : null;
			url = nextCursor && pages < 3 ? `https://api.stripe.com/v1/checkout/sessions?limit=100&starting_after=${encodeURIComponent(nextCursor)}` : null;
		} while (url);
		return res.status(200).json({ scanned, imported, skipped, nextCursor, complete: !nextCursor });
	} catch (error) { return sendPublicError(res, error, 'Stripe history could not be imported'); }
}

module.exports = portalBackfill;

