import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, readJson } from './api';

describe('API transport', () => {
	afterEach(() => vi.useRealTimers());

	it('adds an abort signal and returns the response', async () => {
		const response = { ok: true };
		const fetchImpl = vi.fn().mockResolvedValue(response);
		await expect(apiFetch('/api/health', { headers: { Accept: 'application/json' } }, fetchImpl))
			.resolves.toBe(response);
		expect(fetchImpl).toHaveBeenCalledWith('/api/health', expect.objectContaining({
			headers: { Accept: 'application/json' },
			signal: expect.any(AbortSignal),
		}));
	});

	it('turns an aborted request into a safe timeout message', async () => {
		vi.useFakeTimers();
		const fetchImpl = vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
			signal.addEventListener('abort', () => {
				const error = new Error('aborted');
				error.name = 'AbortError';
				reject(error);
			});
		}));
		const request = apiFetch('/api/slow', {}, fetchImpl);
		const timeoutExpectation = expect(request).rejects.toThrow(/timed out/i);
		await vi.advanceTimersByTimeAsync(8000);
		await timeoutExpectation;
	});

	it('returns an empty object when a response is not JSON', async () => {
		await expect(readJson({ json: vi.fn().mockRejectedValue(new Error('invalid')) })).resolves.toEqual({});
	});
});
