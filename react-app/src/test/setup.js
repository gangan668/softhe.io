import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
	cleanup();
});

// Mock import.meta.env
vi.stubGlobal('import.meta', {
	env: {
		VITE_GA_MEASUREMENT_ID: 'G-TEST123456',
		VITE_APP_URL: 'http://localhost:5173',
		VITE_ENVIRONMENT: 'test',
		DEV: true,
		PROD: false,
		MODE: 'test'
	}
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => { }, // Deprecated
		removeListener: () => { }, // Deprecated
		addEventListener: () => { },
		removeEventListener: () => { },
		dispatchEvent: () => { },
	}),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
	constructor() { }
	disconnect() { }
	observe() { }
	takeRecords() {
		return [];
	}
	unobserve() { }
};

// Mock scrollTo
window.scrollTo = () => { };

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
	console.error = (...args) => {
		if (
			typeof args[0] === 'string' &&
			args[0].includes('Warning: ReactDOM.render')
		) {
			return;
		}
		originalError.call(console, ...args);
	};
});

afterAll(() => {
	console.error = originalError;
});
