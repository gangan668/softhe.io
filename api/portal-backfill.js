const { fetchWithTimeout } = require('./_lib/fetch');
const { isAdminEmail, verifyUser } = require('./_lib/supabase');
const { persistPaidOrder } = require('./stripe-webhook');

async function portalBackfill(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
		const user = await verifyUser(req);
		if (!isAdminEmail(user.email)) return res.status(403).json({ error: 'Staff access required' });
		if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Stripe is not configured' });
		let url = 'https://api.stripe.com/v1/checkout/sessions?limit=100';
		let scanned = 0; let imported = 0; let skipped = 0;
		do {
			const response = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } });
			const page = await response.json();
			if (!response.ok) throw new Error(page.error?.message || 'Stripe history could not be read');
			for (const session of page.data || []) {
				scanned += 1;
				if (!['paid', 'no_payment_required'].includes(session.payment_status) || session.metadata?.order_schema !== '1') { skipped += 1; continue; }
				try { await persistPaidOrder({ id: `backfill:${session.id}`, type: 'portal.backfill' }, session); imported += 1; } catch { skipped += 1; }
			}
			const last = page.data?.at(-1)?.id;
			url = page.has_more && last ? `https://api.stripe.com/v1/checkout/sessions?limit=100&starting_after=${encodeURIComponent(last)}` : null;
		} while (url);
		return res.status(200).json({ scanned, imported, skipped });
	} catch (error) { return res.status(error.statusCode || 502).json({ error: error.message }); }
}

module.exports = portalBackfill;

