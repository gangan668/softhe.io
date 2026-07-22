export const notifyTicketReply = async (session, payload, fetchImpl = fetch) => {
	if (!session?.access_token) return false;
	const response = await fetchImpl('/api/ticket-notification', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
		body: JSON.stringify(payload),
	});
	return response.ok;
};

