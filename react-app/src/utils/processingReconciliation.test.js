import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkReconciliation } from '../../scripts/check-processing-reconciliation.js';

const require = createRequire(import.meta.url);
const health = require('../../../api/health.js');
const response = () => ({ statusCode: 0, payload: null, setHeader: vi.fn(), status(value) { this.statusCode = value; return this; }, json(value) { this.payload = value; return this; } });
const ready = { status: 'ready', checked: 1, reconciled: 1, pending: { stripe: 0, fulfillment: 0 }, truncated: false };
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('durable processing monitor', () => {
	it('requires its separate strong secret without touching storage', async () => {
		const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
		vi.stubEnv('MONITORING_RECONCILIATION_SECRET', '');
		const res = response();
		await health({ method: 'GET', query: { action: 'reconcile-processing' }, headers: {} }, res);
		expect(res.statusCode).toBe(503);
		vi.stubEnv('MONITORING_RECONCILIATION_SECRET', 'r'.repeat(32));
		await health({ method: 'GET', query: { action: 'reconcile-processing' }, headers: { authorization: 'Bearer wrong' } }, res);
		expect(res.statusCode).toBe(401);
		expect(fetch).not.toHaveBeenCalled();
	});
	it('returns only counts and flags for authenticated durable pending attempts', async () => {
		vi.stubEnv('MONITORING_RECONCILIATION_SECRET', 'r'.repeat(32));
		vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example');
		vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-storage-token');
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: JSON.stringify({ ...ready, pending: { stripe: 1, fulfillment: 0 } }) }) }));
		const res = response();
		await health({ method: 'GET', query: { action: 'reconcile-processing' }, headers: { authorization: `Bearer ${'r'.repeat(32)}` } }, res);
		expect(res.statusCode).toBe(200);
		expect(res.payload.status).toBe('attention-required');
		expect(res.payload.pending.stripe).toBe(1);
		expect(JSON.stringify(res.payload)).not.toMatch(/session|token|customer|attemptId/);
	});
	it('fails closed on unavailable durable storage', async () => {
		vi.stubEnv('MONITORING_RECONCILIATION_SECRET', 'r'.repeat(32));
		vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
		const res = response();
		await health({ method: 'GET', query: { action: 'reconcile-processing' }, headers: { authorization: `Bearer ${'r'.repeat(32)}` } }, res);
		expect(res.statusCode).toBe(503);
	});
	it('fails the scheduled check on incomplete attempts, overflow or malformed responses', () => {
		expect(() => checkReconciliation(ready)).not.toThrow();
		expect(() => checkReconciliation({ ...ready, pending: { stripe: 0, fulfillment: 1 } })).toThrow(/1 fulfillment/);
		expect(() => checkReconciliation({ ...ready, truncated: true })).toThrow(/truncated: true/);
		expect(() => checkReconciliation({ error: 'Unauthorized' })).toThrow(/Invalid processing/);
	});
});
