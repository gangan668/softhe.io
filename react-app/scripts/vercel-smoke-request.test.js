import { describe, expect, it } from 'vitest';
import { parseCurlResponse } from './vercel-smoke-request.js';

describe('authenticated smoke response parsing', () => {
	it('preserves status, security headers, and body', () => {
		const result = parseCurlResponse('HTTP/2 200\r\nx-frame-options: DENY\r\ncontent-type: application/json\r\n\r\n{"status":"ready"}');
		expect(result.response.ok).toBe(true);
		expect(result.response.headers.get('x-frame-options')).toBe('DENY');
		expect(result.text).toBe('{"status":"ready"}');
	});
	it('preserves errors instead of treating them as successful responses', () => {
		const result = parseCurlResponse('HTTP/2 503\r\n\r\nnot ready');
		expect(result.response.status).toBe(503);
		expect(result.response.ok).toBe(false);
	});
	it('skips interim responses', () => {
		expect(parseCurlResponse('HTTP/1.1 100 Continue\r\n\r\nHTTP/2 404\r\n\r\nmissing').response.status).toBe(404);
	});
	it('does not turn a redirect into success', () => {
		expect(parseCurlResponse('HTTP/2 302\r\nlocation: /login\r\n\r\n').response.ok).toBe(false);
	});
	it('rejects non-HTTP output and truncated headers', () => {
		expect(() => parseCurlResponse('not HTTP')).toThrow();
		expect(() => parseCurlResponse('HTTP/2 200')).toThrow();
	});
});
