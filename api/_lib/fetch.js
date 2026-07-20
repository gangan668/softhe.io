const getTimeoutMs = () => {
	const configured = Number(process.env.EXTERNAL_REQUEST_TIMEOUT_MS || 8000);
	return Number.isFinite(configured) ? Math.min(Math.max(configured, 1000), 30000) : 8000;
};

const fetchWithTimeout = async (url, options = {}, fetchImpl = fetch) => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), getTimeoutMs());
	try {
		return await fetchImpl(url, { ...options, signal: controller.signal });
	} catch (error) {
		if (error.name === 'AbortError') throw new Error('External request timed out');
		throw error;
	} finally {
		clearTimeout(timeout);
	}
};

module.exports = { fetchWithTimeout, getTimeoutMs };
