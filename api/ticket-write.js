const { withHttp } = require('./_lib/http');
const { adminRequest, verifyActiveUser } = require('./_lib/supabase');
const { clientIp, enforceRateLimit, enforceSameOrigin, jsonOnly, sendPublicError } = require('./_lib/portal-security');
const { claimKey, deleteKey, redisCommand, setKey } = require('./_lib/redis');

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TICKET_CATEGORIES = new Set(['general','sales','technical','billing']);
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{20,100}$/;

const runIdempotent = async (req, user, operation) => {
	const supplied = String(req.headers?.['idempotency-key'] || '').trim();
	if (!IDEMPOTENCY_KEY.test(supplied)) throw Object.assign(new Error('A valid idempotency key is required'), { statusCode: 400 });
	const key = `portal:ticket-write:${user.id}:${supplied}`;
	const cached = await redisCommand(['GET', key]);
	if (cached) return { ...JSON.parse(cached), duplicate: true };
	const lock = `${key}:lock`;
	if (!(await claimKey(lock, '1', 60))) throw Object.assign(new Error('Request already in progress'), { statusCode: 409, publicMessage: 'Request already in progress' });
	try {
		const result = await operation();
		await setKey(key, JSON.stringify(result), 24 * 3600);
		return result;
	} catch (error) {
		await deleteKey(lock).catch(() => {});
		throw error;
	}
};

async function ticketWrite(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
		jsonOnly(req);
		enforceSameOrigin(req);
		const user = await verifyActiveUser(req);
		await Promise.all([
			enforceRateLimit('ticket-write:user', user.id, 20, 3600),
			enforceRateLimit('ticket-write:ip', clientIp(req), 40, 3600),
		]);
		const action = String(req.body?.action || '');
		if (action === 'create') {
			const subject = String(req.body?.subject || '').trim();
			const category = String(req.body?.category || '').trim().toLowerCase();
			const message = String(req.body?.message || '').trim();
			if (subject.length < 3 || subject.length > 160 || message.length < 3 || message.length > 5000 || !TICKET_CATEGORIES.has(category)) return res.status(400).json({ error: 'Invalid ticket details' });
			const result = await runIdempotent(req, user, async () => ({ id: await adminRequest('rpc/create_ticket_for_user', { method: 'POST', body: { ticket_user: user.id, ticket_subject: subject, ticket_category: category, first_message: message } }) }));
			return res.status(result.duplicate ? 200 : 201).json(result);
		}
		if (action === 'message') {
			const ticketId = String(req.body?.ticketId || '');
			const body = String(req.body?.message || '').trim();
			if (!uuid.test(ticketId) || body.length < 1 || body.length > 5000) return res.status(400).json({ error: 'Invalid ticket reply' });
			const result = await runIdempotent(req, user, async () => {
				const ticket = (await adminRequest(`tickets?id=eq.${ticketId}&user_id=eq.${user.id}&select=id,status`))?.[0];
				if (!ticket || ticket.status === 'closed') throw Object.assign(new Error('Ticket reply is not permitted'), { statusCode: 403 });
				return { id: await adminRequest('rpc/add_ticket_message_for_user', { method: 'POST', body: { ticket_user: user.id, target_ticket: ticketId, message_body: body } }) };
			});
			return res.status(result.duplicate ? 200 : 201).json(result);
		}
		return res.status(400).json({ error: 'Invalid ticket action' });
	} catch (error) { return sendPublicError(res, error, 'Ticket could not be saved'); }
}

module.exports = withHttp(ticketWrite);
module.exports.TICKET_CATEGORIES = TICKET_CATEGORIES;
module.exports.runIdempotent = runIdempotent;
