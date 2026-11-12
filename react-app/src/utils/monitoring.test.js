import { afterEach, describe, expect, it, vi } from 'vitest';
import { initMonitoring, reportError } from './monitoring';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); window.history.replaceState(null, '', '/'); });

describe('monitoring', () => {
	it('excludes authentication credentials in URL queries and fragments from error reports', async () => {
		vi.stubEnv('VITE_ERROR_REPORTING_ENDPOINT', '/api/client-error');
		window.history.replaceState(null, '', '/reset-password?token_hash=private-recovery#access_token=secret-session');
		const sendBeacon = vi.fn().mockReturnValue(true);
		vi.stubGlobal('navigator', { sendBeacon });
		expect(reportError(new Error('Fixture failure'))).toBe(true);
		const blob = sendBeacon.mock.calls[0][1];
		const reader = new FileReader();
		const body = await new Promise((resolve) => { reader.onload = () => resolve(reader.result); reader.readAsText(blob); });
		expect(JSON.parse(body).url).toBe(`${window.location.origin}/reset-password`);
		expect(body).not.toMatch(/private-recovery|secret-session|token_hash|access_token/);
	});
	it('returns a cleanup function that removes global listeners', () => {
		const addSpy = vi.spyOn(window, 'addEventListener');
		const removeSpy = vi.spyOn(window, 'removeEventListener');

		const cleanup = initMonitoring();
		cleanup();

		expect(addSpy).toHaveBeenCalledWith('error', expect.any(Function));
		expect(addSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith('error', expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

		addSpy.mockRestore();
		removeSpy.mockRestore();
	});
});
