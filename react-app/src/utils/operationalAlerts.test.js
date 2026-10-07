import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const stripeWebhook = require('../../../api/stripe-webhook.js');
const fulfillment = require('../../../api/_lib/order-fulfillment.js');
const health = require('../../../api/health.js');
const response = () => {
	const res = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() };
	res.status.mockReturnValue(res);
	res.json.mockReturnValue(res);
	return res;
};
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('operational failure instrumentation', () => {
	it('does not produce Stripe alerts for unsigned traffic', async () => {
		vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'webhook-fixture');
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const res = response();
		await stripeWebhook({ method: 'POST', headers: {}, body: Buffer.from('{}') }, res);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(log).not.toHaveBeenCalled();
	});
	it('emits a safe Stripe operational alert after a signed event fails', async () => {
		vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'webhook-fixture');
		vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example');
		vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-fixture');
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('secret-provider-body')));
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const payload = Buffer.from(JSON.stringify({ id: 'evt_fixture123', type: 'checkout.session.completed', data: { object: { id: 'cs_test_fixture123', payment_status: 'paid' } } }));
		const timestamp = Math.floor(Date.now() / 1000);
		const signature = crypto.createHmac('sha256', 'webhook-fixture').update(`${timestamp}.${payload}`).digest('hex');
		const res = response();
		await stripeWebhook({ method: 'POST', headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` }, body: payload }, res);
		expect(res.status).toHaveBeenCalledWith(503);
		expect(log).toHaveBeenCalledWith('stripe_webhook_failed', expect.objectContaining({ eventId: 'evt_fixture123', sessionId: 'cs_test_fixture123' }));
		expect(JSON.stringify(log.mock.calls)).not.toContain('secret-provider-body');
	});
	it('does not produce fulfillment alerts for invalid signatures', async () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const res = response();
		await fulfillment({ method: 'POST', headers: {}, body: Buffer.from('{}') }, res);
		expect(res.status).toHaveBeenCalledWith(401);
		expect(log).not.toHaveBeenCalled();
	});
	it.each([true, false])('correlates signed receiver processing, successful=%s', async (successful) => {
		vi.stubEnv('ORDER_FULFILLMENT_WEBHOOK_SECRET', 'receiver-fixture');
		vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example');
		vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-fixture');
		vi.stubGlobal('fetch', successful ? vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: 'accepted' }) }) : vi.fn().mockRejectedValue(new Error('provider-secret')));
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		const payload = Buffer.from(JSON.stringify({ eventId: 'evt_fixture123', sessionId: 'cs_test_fixture123', amountTotal: 100, currency: 'eur', customerEmail: 'private@example.com', items: [{ id: 'windows', quantity: 1 }] }));
		const signature = crypto.createHmac('sha256', 'receiver-fixture').update(payload).digest('hex');
		const res = response();
		await fulfillment({ method: 'POST', headers: { 'x-softhe-signature': signature, 'idempotency-key': 'cs_test_fixture123' }, body: payload }, res);
		const started = info.mock.calls.find(([marker]) => marker === 'fulfillment_processing_started')?.[1];
		expect(started.attemptId).toBeTruthy();
		if (successful) expect(info).toHaveBeenCalledWith('fulfillment_processing_finished', expect.objectContaining({ attemptId: started.attemptId }));
		else expect(error).toHaveBeenCalledWith('fulfillment_processing_failed', expect.objectContaining({ attemptId: started.attemptId }));
		expect(JSON.stringify([...info.mock.calls, ...error.mock.calls])).not.toMatch(/private@example.com|provider-secret/);
	});
	it.each(['stripe', 'fulfillment'])('keeps synthetic %s alerts authenticated and Preview-only', async (kind) => {
		vi.stubEnv('MONITORING_TEST_SECRET', 'monitor-fixture');
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.stubEnv('VERCEL_ENV', 'production');
		let res = response();
		await health({ method: 'POST', headers: { authorization: 'Bearer monitor-fixture' }, body: { kind } }, res);
		expect(res.status).toHaveBeenCalledWith(404);
		vi.stubEnv('VERCEL_ENV', 'preview');
		res = response();
		await health({ method: 'POST', headers: {}, body: { kind } }, res);
		expect(res.status).toHaveBeenCalledWith(401);
		expect(log).not.toHaveBeenCalled();
		res = response();
		await health({ method: 'POST', headers: { authorization: 'Bearer monitor-fixture' }, body: { kind } }, res);
		expect(res.status).toHaveBeenCalledWith(202);
		expect(log).toHaveBeenCalledWith(kind === 'stripe' ? 'stripe_webhook_failed' : 'fulfillment_delivery_failed', { monitorTest: true });
	});
});
