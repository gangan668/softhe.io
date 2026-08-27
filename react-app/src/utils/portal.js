export const notifyTicketReply = async (session, payload, fetchImpl = fetch) => {
	if (!session?.access_token) return false;
	const response = await fetchImpl('/api/ticket-notification', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
		body: JSON.stringify(payload),
	});
	return response.ok;
};

export const writeTicket = async (session, payload, fetchImpl = fetch) => {
	const response = await fetchImpl('/api/tickets/write', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(payload) });
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.error || 'Ticket could not be saved');
	return data;
};

