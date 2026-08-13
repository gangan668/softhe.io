import process from 'node:process';

if (process.env.VITE_REQUIRE_PRODUCTION_CONFIG === 'true' || process.env.VERCEL === '1') {
	const required = new Set();
	const add = (...keys) => keys.forEach((key) => required.add(key));
	add('COMMERCE_ENABLED');
	if (process.env.VITE_PORTAL_ENABLED === 'true') add('VITE_SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY','ADMIN_EMAIL_ALLOWLIST','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','PORTAL_RATE_LIMIT_SECRET');
	if (process.env.VITE_CAPTCHA_ENABLED === 'true') add('VITE_TURNSTILE_SITE_KEY');
	if (process.env.VITE_COMMERCE_ENABLED === 'true') add('STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','PUBLIC_SITE_URL');
	if (process.env.NOTIFICATIONS_ENABLED === 'true') add('EMAILJS_SERVICE_ID','EMAILJS_PUBLIC_KEY','EMAILJS_PRIVATE_KEY','EMAILJS_TICKET_TEMPLATE_ID','EMAILJS_ORDER_TEMPLATE_ID');
	const bad = [...required].filter((key) => !process.env[key]?.trim() || /REPLACE|PLACEHOLDER|MASKED|REDACTED|SENSITIVE/i.test(process.env[key]));
	if (!['true', 'false'].includes(process.env.COMMERCE_ENABLED)) bad.push('COMMERCE_ENABLED');
	if (process.env.COMMERCE_ENABLED !== process.env.VITE_COMMERCE_ENABLED) bad.push('COMMERCE_FLAG_MISMATCH');
	const serverSecrets = [...required].filter((key) => /SECRET|PRIVATE|SERVICE_ROLE|TOKEN/.test(key));
	const exposed = serverSecrets.filter((key) => key.startsWith('VITE_'));
	const supabaseUrl = process.env.SUPABASE_URL;
	if (supabaseUrl && process.env.VITE_SUPABASE_URL && supabaseUrl.replace(/\/$/,'') !== process.env.VITE_SUPABASE_URL.replace(/\/$/,'')) bad.push('SUPABASE_PROJECT_MISMATCH');
	if (process.env.VERCEL_ENV === 'preview' && /^sk_live_/.test(process.env.STRIPE_SECRET_KEY || '')) bad.push('PREVIEW_STRIPE_MODE');
	if (exposed.length || bad.length) throw new Error(`Server configuration is incomplete (${[...new Set([...bad,...exposed])].join(', ')})`);
}
console.log('Server security configuration validation passed.');
