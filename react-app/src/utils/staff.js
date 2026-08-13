export const staffRequest = async (session, action, { method = 'GET', query = {}, body } = {}, fetchImpl = fetch) => {
	if (!session?.access_token) throw new Error('Authentication required');
	const params = new URLSearchParams({ action, ...query });
	const response = await fetchImpl(`/api/staff?${params}`, {
		method,
		headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
		body: body ? JSON.stringify(body) : undefined,
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.error || 'Staff request failed');
	return data;
};
