import { describe, expect, it, vi } from 'vitest';
import { findPortalError, isFutureJwtError, runPortalQueriesWithSessionRecovery } from './portalSession';

const result = (error = null) => ({ data: error ? null : [], error });

describe('portal session recovery', () => {
	it('finds the first query error', () => {
		const error = new Error('failed');
		expect(findPortalError([result(), result(error)])).toBe(error);
		expect(isFutureJwtError(new Error('JWT issued at future'))).toBe(true);
	});

	it('does not refresh unrelated database errors', async () => {
		const refreshSession = vi.fn();
		const error = new Error('permission denied');
		const recovered = await runPortalQueriesWithSessionRecovery({ auth: { refreshSession } }, vi.fn().mockResolvedValue([result(error)]));
		expect(recovered.error).toBe(error);
		expect(recovered.sessionInvalid).toBe(false);
		expect(refreshSession).not.toHaveBeenCalled();
	});

	it('refreshes once and retries a future-issued JWT', async () => {
		const runQueries = vi.fn()
			.mockResolvedValueOnce([result(new Error('JWT issued at future'))])
			.mockResolvedValueOnce([result()]);
		const refreshSession = vi.fn().mockResolvedValue({ data: { session: { access_token: 'new' } }, error: null });
		const recovered = await runPortalQueriesWithSessionRecovery({ auth: { refreshSession } }, runQueries);
		expect(recovered.error).toBeNull();
		expect(recovered.refreshed).toBe(true);
		expect(runQueries).toHaveBeenCalledTimes(2);
		expect(refreshSession).toHaveBeenCalledTimes(1);
	});

	it('invalidates the session when refresh fails', async () => {
		const refreshSession = vi.fn().mockResolvedValue({ data: { session: null }, error: new Error('expired') });
		const recovered = await runPortalQueriesWithSessionRecovery(
			{ auth: { refreshSession } },
			vi.fn().mockResolvedValue([result(new Error('JWT issued at future'))]),
		);
		expect(recovered.sessionInvalid).toBe(true);
		expect(recovered.error.message).toMatch(/sign in again/i);
	});

	it('stops after one retry when the JWT remains future-issued', async () => {
		const runQueries = vi.fn().mockResolvedValue([result(new Error('JWT issued at future'))]);
		const refreshSession = vi.fn().mockResolvedValue({ data: { session: {} }, error: null });
		const recovered = await runPortalQueriesWithSessionRecovery({ auth: { refreshSession } }, runQueries);
		expect(recovered.sessionInvalid).toBe(true);
		expect(runQueries).toHaveBeenCalledTimes(2);
		expect(refreshSession).toHaveBeenCalledTimes(1);
	});
});
