const crypto = require('node:crypto');
const { claimKey, redisCommand, setKey } = require('./_lib/redis');
const { getPublicOrigin, normalizeItems, PRODUCTS } = require('./create-checkout-session');
const { sendEmailTemplate } = require('./_lib/emailjs');
const { sendTransactionalEmail } = require('./_lib/resend');
const { assertCommerceConfiguration } = require('./_lib/config');
const { fetchWithTimeout } = require('./_lib/fetch');
const { adminRequest, portalServerConfigured } = require('./_lib/supabase');
const orderFulfillment = require('./_lib/order-fulfillment');

const MAX_WEBHOOK_BYTES = 1024 * 1024;
const RESEND_RETRY_WINDOW_MS = 23 * 60 * 60 * 1000;

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
	'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

const readRawBody = async (req) => {
	if (Buffer.isBuffer(req.body)) {
		if (req.body.length > MAX_WEBHOOK_BYTES) throw new Error('Webhook payload is too large');
		return req.body;
	}
	const chunks = [];
	let totalBytes = 0;
	for await (const chunk of req) {
		const buffer = Buffer.from(chunk);
		totalBytes += buffer.length;
		if (totalBytes > MAX_WEBHOOK_BYTES) throw new Error('Webhook payload is too large');
		chunks.push(buffer);
	}
	return Buffer.concat(chunks);
};

const verifyStripeSignature = (payload, signatureHeader, secret, toleranceSeconds = 300) => {
	if (!signatureHeader || !secret) return false;
	const parts = signatureHeader.split(',').map((part) => part.split('='));
	const timestamp = parts.find(([key]) => key === 't')?.[1];
	const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
	if (!timestamp || signatures.length === 0) return false;
	const timestampSeconds = Number(timestamp);
	if (!Number.isInteger(timestampSeconds) || timestampSeconds <= 0) return false;
	if (Math.abs(Date.now() / 1000 - timestampSeconds) > toleranceSeconds) return false;

	const expected = crypto
		.createHmac('sha256', secret)
		.update(`${timestamp}.${payload.toString('utf8')}`)
		.digest('hex');

	return signatures.some((signature) => {
		if (signature.length !== expected.length) return false;
		return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
	});
};

const getFulfillmentUrl = () => {
	const value = process.env.ORDER_FULFILLMENT_WEBHOOK_URL;
	const secret = process.env.ORDER_FULFILLMENT_WEBHOOK_SECRET;
	if (!value || !secret) throw new Error('Order fulfillment is not configured');
	const url = new URL(value);
	if (url.protocol !== 'https:') throw new Error('Order fulfillment URL must use HTTPS');
	return { secret, url: url.toString() };
};

const getOrderItems = (session) => {
	if (session.metadata?.order_schema !== '1' || !session.metadata?.order_items) {
		throw new Error('Checkout session is missing authoritative order items');
	}
	try {
		return normalizeItems(JSON.parse(session.metadata.order_items));
	} catch {
		throw new Error('Checkout session has invalid authoritative order items');
	}
};

const deliverFulfillment = async (event, session) => {
	const { secret, url } = getFulfillmentUrl();
	const items = getOrderItems(session);
	const body = JSON.stringify({
		eventId: event.id,
		sessionId: session.id,
		amountTotal: session.amount_total,
		currency: session.currency,
		customerEmail: session.customer_details?.email || null,
		customerId: session.customer || null,
		paymentIntentId: session.payment_intent || null,
		items,
		metadata: session.metadata || {},
	});
	const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
	const response = await fetchWithTimeout(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Idempotency-Key': session.id,
			'X-Softhe-Signature': signature,
			...(process.env.ORDER_FULFILLMENT_BYPASS_SECRET
				? { 'x-vercel-protection-bypass': process.env.ORDER_FULFILLMENT_BYPASS_SECRET }
				: {}),
		},
		body,
	});
	if (!response.ok) throw new Error(`Fulfillment delivery failed with status ${response.status}`);
};

const sendOrderConfirmation = async (session) => {
	assertCommerceConfiguration();
	const items = getOrderItems(session);
	const customerEmail = session.customer_details?.email;
	if (!customerEmail) throw new Error('Paid checkout is missing a customer email');
	const origin = getPublicOrigin();
	const details = {
		to_email: customerEmail,
		order_reference: session.id,
		items: items.map((item) => `${PRODUCTS[item.id].name} × ${item.quantity}`).join(', '),
		amount_total: typeof session.amount_total === 'number' ? (session.amount_total / 100).toFixed(2) : '',
		currency: String(session.currency || 'eur').toUpperCase(),
		vat_treatment: session.metadata?.vat_status || process.env.VAT_STATUS || 'not stated',
		vat_id: process.env.VAT_ID || 'Not applicable',
		terms_url: `${origin}/terms`,
		withdrawal_url: `${origin}/withdrawal`,
		support_email: process.env.SUPPORT_EMAIL,
		legal_name: process.env.LEGAL_NAME,
		business_registration_id: process.env.BUSINESS_REGISTRATION_ID,
		fulfillment_status: 'Payment confirmed; fulfillment is being prepared',
	};
	if (process.env.ORDER_CONFIRMATION_PROVIDER === 'resend') {
		const lines = [
			`Order reference: ${details.order_reference}`,
			`Products: ${details.items}`,
			`Total paid: ${details.amount_total} ${details.currency}`,
			`VAT treatment: ${details.vat_treatment}`,
			`VAT ID: ${details.vat_id}`,
			'', details.fulfillment_status,
			`Terms: ${details.terms_url}`,
			`Withdrawal request: ${details.withdrawal_url}`,
			`Support: ${details.support_email}`,
			`${details.legal_name} (${details.business_registration_id})`,
		];
		await sendTransactionalEmail({
			to: customerEmail,
			subject: `Softhe.io order confirmation ${session.id}`,
			text: lines.join('\n'),
			html: `<h1>Payment confirmed</h1>${lines.map((line) => line ? `<p>${escapeHtml(line)}</p>` : '').join('')}`,
			idempotencyKey: `order-confirmation/${session.id}`,
		});
		return;
	}
	await sendEmailTemplate(process.env.EMAILJS_ORDER_TEMPLATE_ID, details);
};

const persistPaidOrder = async (event, session) => {
	const items = getOrderItems(session);
	const email = String(session.customer_details?.email || '').trim().toLowerCase();
	if (!email) throw new Error('Paid checkout is missing a customer email');
	const existingOrder = (await adminRequest(`orders?stripe_session_id=eq.${encodeURIComponent(session.id)}&select=id,user_id`))?.[0];
	const orderRows = await adminRequest('orders?on_conflict=stripe_session_id', {
		method: 'POST',
		body: {
			user_id: session.metadata?.portal_user_id || existingOrder?.user_id || null,
			stripe_session_id: session.id,
			stripe_customer_id: session.customer || null,
			payment_intent_id: session.payment_intent || null,
			customer_email: email,
			status: 'paid',
			amount_total: session.amount_total || 0,
			currency: String(session.currency || 'eur').toLowerCase(),
			updated_at: new Date().toISOString(),
		},
		headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
	});
	const order = orderRows?.[0];
	if (!order) throw new Error('Order persistence returned no order');
	await adminRequest('order_items?on_conflict=order_id,product_id', {
		method: 'POST',
		body: items.map((item) => ({ order_id: order.id, product_id: item.id, product_name: PRODUCTS[item.id].name, quantity: item.quantity })),
		headers: { Prefer: 'resolution=merge-duplicates' },
	});
	const insertedEvents = await adminRequest('stripe_webhook_events?on_conflict=event_id', {
		method: 'POST', body: { event_id: event.id, event_type: event.type }, headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
	});
	if (order.user_id && insertedEvents?.length) await adminRequest('activity_events', { method: 'POST', body: {
		user_id: order.user_id, actor_id: order.user_id, event_type: 'order.paid', resource_type: 'order', resource_id: order.id,
		metadata: { amount_total: order.amount_total, currency: order.currency },
	} });
	return order;
};

const fulfillPaidSession = async (event) => {
	const session = event.data.object;
	if (!['paid', 'no_payment_required'].includes(session.payment_status)) return 'payment-pending';
	const key = `stripe:fulfilled:${session.id}`;
	const lockKey = `${key}:processing`;
	const token = crypto.randomUUID();
	if (await redisCommand(['GET', key])) return 'duplicate';
	const claimed = await claimKey(lockKey, token, 600);
	if (!claimed) return 'duplicate';

	try {
		if (await redisCommand(['GET', key])) return 'duplicate';
		if (portalServerConfigured() && !await redisCommand(['GET', `${key}:order`])) {
			await persistPaidOrder(event, session);
			await setKey(`${key}:order`, 'completed', 60 * 60 * 24 * 400);
		}
		if (!await redisCommand(['GET', `${key}:delivery`])) {
			// The receiver deduplicates by session ID if delivery succeeds before this write.
			await deliverFulfillment(event, session);
			await setKey(`${key}:delivery`, 'completed', 60 * 60 * 24 * 400);
		}
		const emailKey = `${key}:email`;
		const reviewKey = `${key}:confirmation-review`;
		const recordConfirmationReview = async (reason) => {
			await claimKey(reviewKey, JSON.stringify({
				sessionId: session.id,
				reason,
				createdAt: new Date().toISOString(),
			}), 60 * 60 * 24 * 400);
			console.error('stripe_confirmation_requires_review', { sessionId: session.id, reason });
		};
		const emailState = await redisCommand(['GET', emailKey]);
		if (await redisCommand(['GET', reviewKey])) {
			console.error('stripe_confirmation_requires_review', { sessionId: session.id, reason: 'review-recorded' });
			return 'confirmation-review-required';
		}
		const resendStartedAt = emailState?.startsWith('resend:') ? Number(emailState.slice(7)) : null;
		const canRetryResend = process.env.ORDER_CONFIRMATION_PROVIDER === 'resend'
			&& Number.isFinite(resendStartedAt) && resendStartedAt > 0
			&& Date.now() - resendStartedAt < RESEND_RETRY_WINDOW_MS;
		if (emailState && emailState !== 'completed' && !canRetryResend) {
			// EmailJS has no idempotency key, and Resend keys expire after 24 hours.
			await recordConfirmationReview('uncertain-confirmation');
			return 'confirmation-review-required';
		}
		if (!emailState) {
			const pendingState = process.env.ORDER_CONFIRMATION_PROVIDER === 'resend' ? `resend:${Date.now()}` : 'attempted';
			if (!await claimKey(emailKey, pendingState, 60 * 60 * 24 * 400)) return 'confirmation-review-required';
		}
		if (emailState !== 'completed') {
			try {
				await sendOrderConfirmation(session);
			} catch (error) {
				if (process.env.ORDER_CONFIRMATION_PROVIDER !== 'resend' || error.statusCode === 409) {
					await recordConfirmationReview(error.statusCode === 409 ? 'resend-idempotency-conflict' : 'emailjs-send-failed');
				}
				throw error;
			}
			await setKey(emailKey, 'completed', 60 * 60 * 24 * 400);
		}
		await setKey(key, JSON.stringify({ eventId: event.id, status: 'completed' }), 60 * 60 * 24 * 90);
		return 'fulfilled';
	} finally {
		const unlock = "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0";
		await redisCommand(['EVAL', unlock, 1, lockKey, token]).catch(() => {});
	}
};

async function stripeWebhook(req, res) {
	if (req.headers['x-softhe-signature']) return orderFulfillment(req, res);
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}
	if (!process.env.STRIPE_WEBHOOK_SECRET) {
		return res.status(503).json({ error: 'Stripe webhook is not configured' });
	}

	let payload;
	try {
		payload = await readRawBody(req);
	} catch (error) {
		return res.status(413).json({ error: error.message });
	}
	if (!verifyStripeSignature(payload, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)) {
		return res.status(400).json({ error: 'Invalid Stripe signature' });
	}

	let event;
	try {
		event = JSON.parse(payload.toString('utf8'));
	} catch {
		return res.status(400).json({ error: 'Invalid JSON payload' });
	}

	if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
		try {
			const status = await fulfillPaidSession(event);
			return res.status(200).json({ received: true, status });
		} catch (error) {
			console.error('stripe_fulfillment_failed', {
				eventId: event.id || null,
				sessionId: event.data?.object?.id || null,
				message: error.message,
			});
			return res.status(503).json({ error: 'Fulfillment temporarily unavailable' });
		}
	} else if (event.type === 'checkout.session.expired') {
		console.info('Stripe checkout expired', { sessionId: event.data.object.id });
	}

	return res.status(200).json({ received: true });
}

module.exports = stripeWebhook;
module.exports.config = { api: { bodyParser: false } };
module.exports.verifyStripeSignature = verifyStripeSignature;
module.exports.readRawBody = readRawBody;
module.exports.deliverFulfillment = deliverFulfillment;
module.exports.fulfillPaidSession = fulfillPaidSession;
module.exports.getFulfillmentUrl = getFulfillmentUrl;
module.exports.getOrderItems = getOrderItems;
module.exports.sendOrderConfirmation = sendOrderConfirmation;
module.exports.persistPaidOrder = persistPaidOrder;
