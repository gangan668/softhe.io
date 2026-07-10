import { describe, expect, it, vi } from 'vitest';
import { initMonitoring } from './monitoring';

describe('monitoring', () => {
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
