import process from 'node:process';

const baseUrl = (process.env.PRODUCTION_BASE_URL || 'https://softhe.io').replace(/\/$/, '');
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

for (const path of ['/', '/store', '/contact', '/terms', '/privacy-policy']) {
	const { response, text } = await request(path);
	assert(response.ok, `${path} returned ${response.status}`);
	assert(/<html/i.test(text), `${path} did not return HTML`);
}

const unknown = await request('/production-smoke-route-that-must-not-exist');
assert(unknown.response.status === 404, `unknown route returned ${unknown.response.status}, expected 404`);

if (requireServerlessApi) {
	const { response, text } = await request('/api/health');
	assert(response.status === 200, `/api/health returned ${response.status}: ${text.slice(0, 300)}`);
	const health = JSON.parse(text);
	assert(health.status === 'ready', `/api/health is not ready: ${text.slice(0, 300)}`);
}

console.log(`Production smoke checks passed for ${baseUrl}.`);
