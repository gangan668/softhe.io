const getEnv = (key, fallback = '') => {
	try {
		return import.meta.env?.[key] || fallback;
	} catch {
		return fallback;
	}
};

const endpoint = () => getEnv('VITE_ERROR_REPORTING_ENDPOINT');
const environment = () => getEnv('VITE_ENVIRONMENT', import.meta.env?.MODE || 'production');

const serializeError = (error, context = {}) => ({
	message: error?.message || String(error),
	stack: error?.stack,
	name: error?.name,
	url: typeof window !== 'undefined' ? window.location.href : undefined,
	environment: environment(),
	context,
	timestamp: new Date().toISOString(),
});

export const reportError = (error, context = {}) => {
	const target = endpoint();
	const payload = serializeError(error, context);

	if (!target) {
		if (import.meta.env?.DEV) {
			console.warn('Error reporting endpoint is not configured.', payload);
		}
		return false;
	}

	try {
		const body = JSON.stringify(payload);
		if (navigator.sendBeacon) {
			return navigator.sendBeacon(target, new Blob([body], { type: 'application/json' }));
		}

		fetch(target, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
			keepalive: true,
		}).catch(() => {});
		return true;
	} catch {
		return false;
	}
};

export const initMonitoring = () => {
	if (typeof window === 'undefined') return;

	window.addEventListener('error', (event) => {
		reportError(event.error || event.message, { source: 'window.error' });
	});

	window.addEventListener('unhandledrejection', (event) => {
		reportError(event.reason || 'Unhandled promise rejection', { source: 'unhandledrejection' });
	});
};
