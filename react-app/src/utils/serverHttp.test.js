import { createRequire } from 'node:module';
import { createServer, request } from 'node:http';
import { once } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { withHttp } = require('../../../api/_lib/http.js');
const { readJsonBody } = require('../../../api/_lib/json-body.js');
const deployment = require('../../../vercel.json');

const exchange = async (handler, { method = 'POST', path = '/', headers = {}, chunks = [] } = {}) => {
	const server = createServer(handler);
	server.listen(0, '127.0.0.1');
	await once(server, 'listening');
	try {
		return await new Promise((resolve, reject) => {
			const outgoing = request({ host: '127.0.0.1', port: server.address().port, method, path, headers }, (incoming) => {
				let body = '';
				incoming.setEncoding('utf8');
				incoming.on('data', (chunk) => { body += chunk; });
				incoming.on('end', () => resolve({ status: incoming.statusCode, headers: incoming.headers, body }));
				incoming.on('error', reject);
			});
			outgoing.on('error', reject);
			for (const chunk of chunks) outgoing.write(chunk);
			outgoing.end();
		});
	} finally {
		server.closeAllConnections();
		await new Promise((resolve) => server.close(resolve));
	}
};

describe('native HTTP API adapter', () => {
	it('disables automatic provider helpers during build and runtime', () => {
		expect(deployment.env.NODEJS_HELPERS).toBe('0');
		expect(deployment.build.env.NODEJS_HELPERS).toBe('0');
	});

	it('parses chunked UTF-8 once and preserves duplicate query parameters', async () => {
		const raw = Buffer.from(JSON.stringify({ message: 'Hello é world' }));
		const split = raw.indexOf(Buffer.from('é')) + 1;
		const handler = withHttp((req, res) => res.status(201).json({ body: req.body, query: req.query }));
		const response = await exchange(handler, { path: '/?action=first&action=second&__proto__=safe', headers: { 'content-type': 'application/json', 'transfer-encoding': 'chunked' }, chunks: [raw.subarray(0, split), raw.subarray(split)] });
		expect(response.status).toBe(201);
		expect(JSON.parse(response.body)).toEqual({ body: { message: 'Hello é world' }, query: { action: ['first', 'second'], ['__proto__']: 'safe' } });
		expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
	});

	it('rejects malformed oversized chunked bodies before JSON.parse', async () => {
		const handler = vi.fn();
		const parse = vi.spyOn(JSON, 'parse');
		try {
			const response = await exchange(withHttp(handler), { headers: { 'content-type': 'application/json', 'transfer-encoding': 'chunked' }, chunks: [Buffer.from('{"message":"'), Buffer.from('é'.repeat(9000))] });
			expect(response.status).toBe(413);
			expect(handler).not.toHaveBeenCalled();
			expect(parse.mock.calls.some(([body]) => Buffer.byteLength(String(body), 'utf8') > 16384)).toBe(false);
		} finally { parse.mockRestore(); }
	});

	it('rejects large Content-Length before waiting for any body', async () => {
		const handler = vi.fn();
		const response = await exchange(withHttp(handler), { headers: { 'content-type': 'application/json', 'content-length': '100000' } });
		expect(response.status).toBe(413);
		expect(handler).not.toHaveBeenCalled();
	});

	it.each([
		['text/plain', '{}', 415],
		['application/json', '{invalid', 400],
		['application/json', 'null', 400],
		['application/json', '[]', 400],
	])('rejects invalid HTTP JSON input %s %s', async (type, body, status) => {
		const response = await exchange(withHttp(() => { throw new Error('Handler must not run'); }), { headers: { 'content-type': type }, chunks: [body] });
		expect(response.status).toBe(status);
	});

	it('reads streams without invoking a lazy provider body getter', async () => {
		const getter = vi.fn(() => { throw new Error('Provider parser must not run'); });
		const req = { headers: { 'content-type': 'application/json' }, async *[Symbol.asyncIterator]() { yield Buffer.from('{"ok":true}'); } };
		Object.defineProperty(req, 'body', { get: getter });
		await expect(readJsonBody(req)).resolves.toEqual({ ok: true });
		expect(getter).not.toHaveBeenCalled();
	});

	it('preserves webhook raw bytes for signature verification', async () => {
		const payload = '{ "signed": true }';
		const handler = withHttp(async (req, res) => {
			const chunks = [];
			for await (const chunk of req) chunks.push(chunk);
			return res.status(200).json({ raw: Buffer.concat(chunks).toString(), bodyWasParsed: req.body !== undefined });
		}, { raw: true });
		const response = await exchange(handler, { headers: { 'content-type': 'application/json' }, chunks: [payload] });
		expect(JSON.parse(response.body)).toEqual({ raw: payload, bodyWasParsed: false });
	});

	it.each(['browser-errors', 'checkout-session', 'contact', 'create-checkout-session', 'health', 'portal-backfill', 'portal-bootstrap', 'stripe-webhook', 'test-fulfillment', 'ticket-notification', 'ticket-write', 'withdrawal'])('serves %s through native HTTP without Vercel response helpers', async (name) => {
		const handler = require(`../../../api/${name}.js`);
		const response = await exchange(handler, { method: 'DELETE' });
		expect([404, 405]).toContain(response.status);
		expect(JSON.parse(response.body)).toHaveProperty('error');
	});

	it.each(['browser-errors', 'contact', 'withdrawal'])('enforces the public stream limit at %s before validation or provider calls', async (name) => {
		const outbound = vi.fn(); vi.stubGlobal('fetch', outbound);
		try {
			const handler = require(`../../../api/${name}.js`);
			const response = await exchange(handler, { headers: { 'content-type': 'application/json', 'transfer-encoding': 'chunked' }, chunks: ['{"x":"', 'x'.repeat(17000)] });
			expect(response.status).toBe(413);
			expect(outbound).not.toHaveBeenCalled();
		} finally { vi.unstubAllGlobals(); }
	});
});
