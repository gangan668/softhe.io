const getApiBaseUrl = () => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

const getTimeoutMs = () => {
	const configured = Number(import.meta.env.VITE_API_TIMEOUT || 8000);
	return Number.isFinite(configured) ? Math.min(Math.max(configured, 1000), 30000) : 8000;
};

export const apiFetch = async (path, options = {}, fetchImpl = fetch) => {
	const controller = new AbortController();
	const timeout = window.setTimeout(() => controller.abort(), getTimeoutMs());
	try {
		return await fetchImpl(`${getApiBaseUrl()}${path}`, { ...options, signal: controller.signal });
	} catch (error) {
		if (error.name === 'AbortError') {
			throw new Error('The request timed out. Please try again.', { cause: error });
		}
		throw error;
	} finally {
		window.clearTimeout(timeout);
	}
};

export const readJson = (response) => response.json().catch(() => ({}));
