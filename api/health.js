const crypto = require('node:crypto');
const { OPERATOR_IDENTITY_KEYS } = require('./_lib/config');
const { adminRequest } = require('./_lib/supabase');
const { reconcileProcessing } = require('./_lib/processing-attempts');

const safeEqual = (left, right) => {
	const leftBuffer = Buffer.from(String(left || ''));
	const rightBuffer = Buffer.from(String(right || ''));
	return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const REQUIRED_CONFIGURATION = [
	'PUBLIC_SITE_URL',
	'LEGAL_NAME',
	'LEGAL_ADDRESS',
	'BUSINESS_REGISTRATION_ID',
	'VAT_STATUS',
	'SUPPORT_EMAIL',
	'STRIPE_SECRET_KEY',
	'STRIPE_WEBHOOK_SECRET',
	'UPSTASH_REDIS_REST_URL',
	'UPSTASH_REDIS_REST_TOKEN',
	'CONTACT_RATE_LIMIT_SECRET',
	'PORTAL_RATE_LIMIT_SECRET',
	'CHECKOUT_RECEIPT_SECRET',
	'SUPABASE_URL',
	'SUPABASE_PUBLISHABLE_KEY',
	'SUPABASE_SERVICE_ROLE_KEY',
	'STAFF_PORTAL_ENABLED',
	'EMAILJS_SERVICE_ID',
	'EMAILJS_TEMPLATE_ID',
	'EMAILJS_PUBLIC_KEY',
	'EMAILJS_PRIVATE_KEY',
	'EMAILJS_TICKET_TEMPLATE_ID',
	'EMAILJS_ORDER_TEMPLATE_ID',
	'EMAILJS_WITHDRAWAL_TEMPLATE_ID',
	'EMAILJS_WITHDRAWAL_NOTIFICATION_TEMPLATE_ID',
	'ORDER_FULFILLMENT_WEBHOOK_URL',
	'ORDER_FULFILLMENT_WEBHOOK_SECRET',
];

const getConfigurationStatus = (environment = process.env) => {
	const orderEmailKeys = environment.ORDER_CONFIRMATION_PROVIDER === 'resend'
		? ['RESEND_API_KEY', 'EMAIL_FROM']
		: ['EMAILJS_ORDER_TEMPLATE_ID'];
	const required = [...REQUIRED_CONFIGURATION.filter((key) =>
		environment.ORDER_CONFIRMATION_PROVIDER !== 'resend' || key !== 'EMAILJS_ORDER_TEMPLATE_ID'), ...orderEmailKeys];
	const missing = required.filter((key) => !environment[key]?.trim());
	const invalid = required.filter((key) =>
		/^(?:encrypted|masked|redacted)$/i.test(environment[key]?.trim() || ''));
	if (environment.ORDER_CONFIRMATION_PROVIDER && !['emailjs', 'resend'].includes(environment.ORDER_CONFIRMATION_PROVIDER)) {
		invalid.push('ORDER_CONFIRMATION_PROVIDER');
	}
	if (environment.VAT_STATUS && !['registered', 'not-registered', 'exempt'].includes(environment.VAT_STATUS)) {
		invalid.push('VAT_STATUS');
	}
	if (environment.VAT_STATUS === 'registered' && !/^SE\d{12}$/.test(environment.VAT_ID || '')) {
		invalid.push('VAT_ID');
	}
	if (environment.BUSINESS_REGISTRATION_ID && !/^\d{6}-?\d{4}$/.test(environment.BUSINESS_REGISTRATION_ID)) {
		invalid.push('BUSINESS_REGISTRATION_ID');
	}
	if (environment.SUPPORT_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(environment.SUPPORT_EMAIL)) {
		invalid.push('SUPPORT_EMAIL');
	}
	try {
		if (environment.PUBLIC_SITE_URL && new URL(environment.PUBLIC_SITE_URL).protocol !== 'https:') invalid.push('PUBLIC_SITE_URL');
	} catch {
		invalid.push('PUBLIC_SITE_URL');
	}
	const uniqueInvalid = [...new Set(invalid)];
	return { ready: missing.length === 0 && uniqueInvalid.length === 0, missing, invalid: uniqueInvalid };
};

async function health(req, res) {
	res.setHeader('Cache-Control', 'no-store');
	if (req.method === 'POST') {
		if (process.env.VERCEL_ENV !== 'preview') return res.status(404).json({ error: 'Not found' });
		const configuredSecret = process.env.MONITORING_TEST_SECRET;
		const suppliedSecret = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '');
		if (!configuredSecret || !safeEqual(configuredSecret, suppliedSecret)) {
			return res.status(401).json({ error: 'Unauthorized' });
		}
		const kind = req.body?.kind;
		if (kind === 'browser') console.error('browser_error', { monitorTest: true });
		else if (kind === 'delivery') console.error('contact_delivery_failed', { monitorTest: true });
		else if (kind === 'stripe') console.error('stripe_webhook_failed', { monitorTest: true });
		else if (kind === 'fulfillment') console.error('fulfillment_delivery_failed', { monitorTest: true });
		else return res.status(400).json({ error: 'Unsupported monitoring test' });
		return res.status(202).json({ accepted: true, kind });
	}
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET, POST');
		return res.status(405).json({ error: 'Method not allowed' });
	}
	if (req.query?.action === 'reconcile-processing') {
		const secret = process.env.MONITORING_RECONCILIATION_SECRET;
		const supplied = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '');
		if (!secret || secret.length < 32) return res.status(503).json({ error: 'Processing monitoring is not configured' });
		if (!safeEqual(secret, supplied)) return res.status(401).json({ error: 'Unauthorized' });
		try {
			const result = await reconcileProcessing();
			const attentionRequired = result.pending.stripe > 0 || result.pending.fulfillment > 0 || result.truncated;
			return res.status(200).json({ ...result, status: attentionRequired ? 'attention-required' : 'ready' });
		} catch {
			return res.status(503).json({ error: 'Processing monitoring is temporarily unavailable' });
		}
	}

	const configuration = getConfigurationStatus();
	const readyFor = (keys) => !keys.some((key) => configuration.missing.includes(key) || configuration.invalid.includes(key));
	const storageKeys = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
	const orderEmailKeys = process.env.ORDER_CONFIRMATION_PROVIDER === 'resend'
		? ['RESEND_API_KEY', 'EMAIL_FROM']
		: ['EMAILJS_SERVICE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY', 'EMAILJS_ORDER_TEMPLATE_ID'];
	let portalAccess = readyFor(['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY']);
	if (portalAccess) {
		try { await adminRequest('profiles?select=id&limit=1'); } catch { portalAccess = false; }
	}
	const ready = configuration.ready && portalAccess;
	const sourceCommit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.RELEASE_SOURCE_COMMIT || null;
	const releaseStage = process.env.COMMERCE_ENABLED === 'true' ? 'commerce' : 'stage1';
	const fingerprint = process.env.VERCEL_GIT_COMMIT_SHA
		? `softhe-${process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}-${releaseStage}`
		: process.env.RELEASE_FINGERPRINT || null;
	return res.status(ready ? 200 : 503).json({
		status: ready ? 'ready' : 'configuration-required',
		release: {
			sourceCommit,
			fingerprint,
		},
		checks: {
			portal: portalAccess && readyFor([...storageKeys,'PORTAL_RATE_LIMIT_SECRET','CHECKOUT_RECEIPT_SECRET']),
			checkout: readyFor([...OPERATOR_IDENTITY_KEYS, 'PUBLIC_SITE_URL', 'VAT_STATUS', ...(process.env.VAT_STATUS === 'registered' ? ['VAT_ID'] : []), 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']),
			contact: readyFor([...OPERATOR_IDENTITY_KEYS, ...storageKeys, 'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY', 'CONTACT_RATE_LIMIT_SECRET']),
			tickets: readyFor([...OPERATOR_IDENTITY_KEYS, 'EMAILJS_SERVICE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY', 'EMAILJS_TICKET_TEMPLATE_ID']),
			withdrawal: readyFor([...OPERATOR_IDENTITY_KEYS, ...storageKeys, 'EMAILJS_SERVICE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY', 'EMAILJS_WITHDRAWAL_TEMPLATE_ID', 'EMAILJS_WITHDRAWAL_NOTIFICATION_TEMPLATE_ID', 'CONTACT_RATE_LIMIT_SECRET']),
			storage: readyFor(storageKeys),
			fulfillment: readyFor([...OPERATOR_IDENTITY_KEYS, ...storageKeys, 'ORDER_FULFILLMENT_WEBHOOK_URL', 'ORDER_FULFILLMENT_WEBHOOK_SECRET', ...orderEmailKeys]) && !configuration.invalid.includes('ORDER_CONFIRMATION_PROVIDER'),
		},
	});
}

module.exports = health;
module.exports.REQUIRED_CONFIGURATION = REQUIRED_CONFIGURATION;
module.exports.getConfigurationStatus = getConfigurationStatus;
module.exports.safeEqual = safeEqual;
