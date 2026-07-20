import process from 'node:process';

const baseUrl = (process.env.PRODUCTION_BASE_URL || 'https://softhe.io').replace(/\/$/, '');
const requireAppMarker = process.env.REQUIRE_APP_MARKER === 'true';
const requireSecurityHeaders = process.env.REQUIRE_SECURITY_HEADERS === 'true';
const requireServerlessApi = process.env.REQUIRE_SERVERLESS_API === 'true';

const assert = (condition, message) => {
	if (!condition) throw new Error(message);
};

const request = async (path) => {
	const response = await fetch(`${baseUrl}${path}`, {
		headers: { 'User-Agent': 'softhe-production-smoke/1.0' },
		redirect: 'follow',
	});
	return { response, text: await response.text() };
};

const assertSecurityHeaders = (response, path) => {
	assert(response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"), `${path} is missing the expected Content-Security-Policy`);
	assert(response.headers.get('x-content-type-options') === 'nosniff', `${path} is missing X-Content-Type-Options: nosniff`);
	assert(response.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', `${path} has an unexpected Referrer-Policy`);
	assert(response.headers.get('x-frame-options') === 'DENY', `${path} is missing X-Frame-Options: DENY`);
};

const pagePaths = ['/', '/store', '/contact', '/terms', '/privacy-policy'];
if (requireAppMarker) pagePaths.push('/withdrawal');

for (const path of pagePaths) {
	const { response, text } = await request(path);
	assert(response.ok, `${path} returned ${response.status}`);
	assert(/<html/i.test(text), `${path} did not return HTML`);
	if (requireAppMarker) {
		assert(/name=["']softhe-app["']\s+content=["']softhe\.io["']/i.test(text), `${path} did not return the Softhe.io application`);
	}
	if (requireSecurityHeaders) assertSecurityHeaders(response, path);
}

const unknown = await request('/production-smoke-route-that-must-not-exist');
assert(unknown.response.status === 404, `unknown route returned ${unknown.response.status}, expected 404`);

if (requireServerlessApi) {
	const { response: healthResponse, text: healthText } = await request('/api/health');
	assert(healthResponse.status === 200, `/api/health returned ${healthResponse.status}: ${healthText.slice(0, 300)}`);
	assert(healthResponse.headers.get('content-type')?.includes('application/json'), '/api/health did not return JSON');
	const health = JSON.parse(healthText);
	assert(health.status === 'ready', `/api/health is not ready: ${healthText.slice(0, 300)}`);
	assert(Object.values(health.checks || {}).every(Boolean), `/api/health has incomplete checks: ${healthText.slice(0, 300)}`);
}

console.log(`Production smoke checks passed for ${baseUrl}.`);
