const crypto = require('node:crypto');
const { redisCommand } = require('./redis');
const ticketWrite = require('../ticket-write');
const staffApi = require('./staff-handler');

const ISOLATED_URL = 'https://zbchdxptibehtizomwiq.supabase.co';
const LOCK = 'portal:provider-verification:isolated:lock';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const assert = (condition) => { if (!condition) throw new Error('Provider assertion failed'); };

function allowed(req, environment = process.env) {
	if (req.method !== 'POST' || environment.VERCEL_ENV !== 'preview' || environment.SUPABASE_URL !== ISOLATED_URL || environment.PROVIDER_VERIFICATION_ENABLED !== 'true' || environment.VERCEL_GIT_COMMIT_REF !== 'customer-portal-test') return false;
	const configured = Buffer.from(environment.MONITORING_TEST_SECRET || '');
	const supplied = Buffer.from(String(req.headers?.authorization || '').replace(/^Bearer\s+/i, ''));
	return configured.length >= 32 && configured.length === supplied.length && crypto.timingSafeEqual(configured, supplied) && req.body?.acknowledgeTemporaryUsers === true;
}

function totpCode(secret, milliseconds = Date.now()) {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
	for (const character of String(secret).toUpperCase().replace(/=+$/, '')) { const index = alphabet.indexOf(character); assert(index >= 0); bits += index.toString(2).padStart(5, '0'); }
	const bytes = []; for (let offset = 0; offset + 8 <= bits.length; offset += 8) bytes.push(parseInt(bits.slice(offset, offset + 8), 2));
	const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(milliseconds / 30000)));
	const digest = crypto.createHmac('sha1', Buffer.from(bytes)).update(counter).digest(); const offset = digest.at(-1) & 15;
	return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}

async function providerRequest(path, { admin = false, token, method = 'GET', body, representation = false } = {}) {
	const key = admin ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.SUPABASE_PUBLISHABLE_KEY;
	const bearer = token || (admin && !key?.startsWith('sb_secret_') ? key : undefined);
	assert(key);
	const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 4000);
	try {
		const response = await fetch(`${ISOLATED_URL}${path}`, { method, signal: controller.signal, headers: { apikey: key, ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), 'Content-Type': 'application/json', ...(representation ? { Prefer: 'return=representation' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
		const data = response.status === 204 ? null : await response.json().catch(() => null);
		return { status: response.status, ok: response.ok, data };
	} finally { clearTimeout(timer); }
}

async function invoke(handler, token, path, body, ip, key) {
	const request = { method: body ? 'POST' : 'GET', headers: { host: 'isolated-provider.invalid', origin: 'https://isolated-provider.invalid', 'content-type': 'application/json', 'x-forwarded-for': ip, ...(token ? { authorization: `Bearer ${token}` } : {}), ...(key ? { 'idempotency-key': key } : {}) }, query: Object.fromEntries(new URL(path, 'https://isolated-provider.invalid').searchParams), body };
	const result = {}; const response = { setHeader() {}, status(status) { result.status = status; return this; }, json(data) { result.data = data; return this; } };
	await handler(request, response); return result;
}

async function runVerification({ request: rawRequest = providerRequest, command = redisCommand, ticketHandler: rawTicketHandler = ticketWrite, staffHandler: rawStaffHandler = staffApi, now = Date.now, runId: requestedRunId } = {}) {
	const runId = requestedRunId || crypto.randomUUID(); assert(UUID.test(runId)); const ip = `provider-${runId}`; const users = []; const writeKeys = []; const checks = []; let phase = 'configuration'; let failed = false;
	const started = now(); let cleaning = false; let journaled = false;
	const budget = () => { if (!cleaning) assert(now() - started < 150000); };
	const request = (...args) => { budget(); return rawRequest(...args); };
	const ticketHandler = (...args) => { budget(); return rawTicketHandler(...args); };
	const staffHandler = (...args) => { budget(); return rawStaffHandler(...args); };
	const result = { runId, project: 'zbchdxptibehtizomwiq', sourceCommit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.RELEASE_SOURCE_COMMIT || null, startedAt: new Date().toISOString(), checks, cleanup: { passed: false }, emailSent: false, evidenceType: 'real Auth, database, Redis, and deployed source handlers; no browser or inbox claim' };
	const step = async (name, operation) => { phase = name; budget(); await operation(); checks.push({ name, passed: true }); };
	const rest = async (path, options) => { const response = await request(`/rest/v1/${path}`, options); assert(response.ok); return response.data; };
	const nextKey = (user, namespace = 'ticket-write') => { const key = `provider_${crypto.randomUUID().replaceAll('-', '')}`; writeKeys.push(`portal:${namespace}:${user.id}:${key}`); return key; };
	let plannedKeys;
	try {
		assert(process.env.SUPABASE_URL === ISOLATED_URL && process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_GIT_COMMIT_REF === 'customer-portal-test' && process.env.PROVIDER_VERIFICATION_ENABLED === 'true');
		assert(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_PUBLISHABLE_KEY && process.env.PORTAL_RATE_LIMIT_SECRET && process.env.STAFF_PORTAL_ENABLED === 'true');
		users.push(...Array.from({ length: 2 }, () => ({ id: crypto.randomUUID(), created: false })));
		plannedKeys = [nextKey(users[0]), nextKey(users[0]), nextKey(users[1]), nextKey(users[1], 'staff-write'), nextKey(users[0])];
		const journal = { runId, userIds: users.map((user) => user.id), writeKeys, startedAt: result.startedAt };
		assert(await command(['SET', `portal:provider-verification:journal:${runId}`, JSON.stringify(journal), 'NX', 'EX', 86400]) === 'OK'); journaled = true;
		await command(['SET', 'portal:provider-verification:last-run', runId, 'EX', 86400]);
		await step('temporary_auth_password_signin', async () => {
			for (let index = 0; index < 2; index++) {
				const email = `portal-${runId}-${index}@example.test`; const password = 'Aa1!' + crypto.randomBytes(24).toString('hex');
				const user = users[index]; const id = user.id;
				const created = await request('/auth/v1/admin/users', { admin: true, method: 'POST', body: { id, email, password, email_confirm: true, user_metadata: { full_name: 'Temporary provider verification' } } });
				assert(created.ok); assert((created.data?.user?.id || created.data?.id) === id); user.created = true;
				const signin = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }); assert(signin.ok && signin.data?.access_token && signin.data?.user?.id === id); user.token = signin.data.access_token;
			}
		});
		const [customer, staff] = users; let ticketId;
		await step('profile_persistence_and_customer_rls', async () => {
			await rest(`profiles?id=eq.${customer.id}`, { token: customer.token, method: 'PATCH', body: { full_name: 'Verified isolated customer', billing_address: { city: 'Test City' } } });
			const own = await rest(`profiles?id=eq.${customer.id}&select=id,full_name,billing_address`, { token: customer.token }); assert(own.length === 1 && own[0].full_name === 'Verified isolated customer' && own[0].billing_address?.city === 'Test City');
			const cross = await rest(`profiles?id=eq.${customer.id}&select=id`, { token: staff.token }); assert(cross.length === 0);
			const crossWrite = await request(`/rest/v1/profiles?id=eq.${customer.id}`, { token: staff.token, method: 'PATCH', body: { full_name: 'Forbidden' }, representation: true }); assert(!crossWrite.ok || crossWrite.data?.length === 0);
		});
		await step('ticket_create_idempotency_and_reply_rls', async () => {
			const key = plannedKeys[0]; const body = { action: 'create', subject: 'Temporary provider verification', category: 'general', message: 'Synthetic ticket. No customer request.' };
			const created = await invoke(ticketHandler, customer.token, '/', body, ip, key); assert(created.status === 201 && UUID.test(created.data?.id)); ticketId = created.data.id;
			const replay = await invoke(ticketHandler, customer.token, '/', body, ip, key); assert(replay.status === 200 && replay.data?.duplicate === true && replay.data.id === ticketId);
			const bodyReply = { action: 'message', ticketId, message: 'Synthetic verified customer reply' };
			const reply = await invoke(ticketHandler, customer.token, '/', bodyReply, ip, plannedKeys[1]); assert(reply.status === 201 && UUID.test(reply.data?.id));
			const messages = await rest(`ticket_messages?ticket_id=eq.${ticketId}&select=id,body`, { token: customer.token }); assert(messages.some((message) => message.body === bodyReply.message));
			const cross = await rest(`tickets?id=eq.${ticketId}&select=id`, { token: staff.token }); assert(cross.length === 0);
			const denied = await invoke(ticketHandler, staff.token, '/', bodyReply, ip, plannedKeys[2]); assert(denied.status >= 400);
		});
		await step('anonymous_and_aal1_staff_denial', async () => {
			for (const token of [undefined, staff.token]) { const denial = await invoke(staffHandler, token, '/?action=status', undefined, ip); assert([401,403].includes(denial.status)); }
		});
		await step('real_totp_aal2_without_ownership_bypass', async () => {
			const enrolled = await request('/auth/v1/factors', { token: staff.token, method: 'POST', body: { factor_type: 'totp', friendly_name: 'Temporary provider verification' } }); assert(enrolled.ok && enrolled.data?.id && enrolled.data?.totp?.secret);
			const challenge = await request(`/auth/v1/factors/${enrolled.data.id}/challenge`, { token: staff.token, method: 'POST', body: {} }); assert(challenge.ok && challenge.data?.id);
			const verified = await request(`/auth/v1/factors/${enrolled.data.id}/verify`, { token: staff.token, method: 'POST', body: { challenge_id: challenge.data.id, code: totpCode(enrolled.data.totp.secret) } }); assert(verified.ok && verified.data?.access_token); staff.token = verified.data.access_token;
			const claims = JSON.parse(Buffer.from(staff.token.split('.')[1], 'base64url').toString()); assert(claims.aal === 'aal2');
			const user = await request('/auth/v1/user', { token: staff.token }); assert(user.ok && user.data?.id === staff.id);
			const cross = await rest(`profiles?id=eq.${customer.id}&select=id`, { token: staff.token }); assert(cross.length === 0);
			const denial = await invoke(staffHandler, staff.token, '/?action=status', undefined, ip); assert(denial.status === 403);
		});
		await step('temporary_staff_grant_actions_and_revocation', async () => {
			await rest('rpc/grant_staff_access', { admin: true, method: 'POST', body: { target_user: staff.id, actor_user: customer.id, target_role: 'staff', valid_until: new Date(Date.now() + 20 * 60000).toISOString(), reason: 'Temporary isolated provider verification' } });
			const status = await invoke(staffHandler, staff.token, '/?action=status', undefined, ip); assert(status.status === 200 && status.data?.authorized === true && status.data?.mfa === 'aal2');
			const conversation = await invoke(staffHandler, staff.token, `/?action=ticket&id=${ticketId}`, undefined, ip); assert(conversation.status === 200 && conversation.data?.ticket?.id === ticketId);
			const reply = await invoke(staffHandler, staff.token, '/?action=reply', { ticketId, message: 'Synthetic verified staff reply' }, ip, plannedKeys[3]); assert(reply.status === 201);
			await rest('rpc/revoke_staff_access', { admin: true, method: 'POST', body: { target_user: staff.id, revoker: customer.id, revoke_reason: 'Temporary isolated verification completed' } });
			const denied = await invoke(staffHandler, staff.token, '/?action=status', undefined, ip); assert([401,403].includes(denied.status));
		});
		await step('suspended_customer_write_denial', async () => {
			await rest(`profiles?id=eq.${customer.id}`, { admin: true, method: 'PATCH', body: { account_status: 'suspended' } });
			const denied = await invoke(ticketHandler, customer.token, '/', { action: 'create', subject: 'Should be denied', category: 'general', message: 'Suspended customer fixture' }, ip, plannedKeys[4]); assert(denied.status === 403);
		});
	} catch { failed = true; result.failedPhase = phase; }
	finally {
		cleaning = true;
		let clean = true;
		for (const user of journaled ? users : []) {
			try { if (user.token) { const signedOut = await request('/auth/v1/logout?scope=global', { token: user.token, method: 'POST' }); assert(signedOut.ok || [401,403,404].includes(signedOut.status)); } } catch { clean = false; }
			try { await rest(`staff_audit_events?actor_id=eq.${user.id}`, { admin: true, method: 'DELETE' }); } catch { clean = false; }
			try { const deleted = await request(`/auth/v1/admin/users/${user.id}`, { admin: true, method: 'DELETE' }); assert(deleted.ok || deleted.status === 404); } catch { clean = false; }
			try { const remaining = await request(`/auth/v1/admin/users/${user.id}`, { admin: true }); assert(remaining.status === 404); const profiles = await rest(`profiles?id=eq.${user.id}&select=id`, { admin: true }); assert(profiles.length === 0); } catch { clean = false; }
			for (const path of [`tickets?user_id=eq.${user.id}&select=id`, `ticket_messages?author_id=eq.${user.id}&select=id`, `user_roles?user_id=eq.${user.id}&select=user_id`, `activity_events?user_id=eq.${user.id}&select=id`, `staff_audit_events?actor_id=eq.${user.id}&select=id`]) {
				try { const remaining = await rest(path, { admin: true }); assert(remaining.length === 0); } catch { clean = false; }
			}
		}
		try {
			const keys = writeKeys.flatMap((key) => [key, `${key}:lock`]);
			if (process.env.PORTAL_RATE_LIMIT_SECRET) { const hash = (identity) => crypto.createHmac('sha256', process.env.PORTAL_RATE_LIMIT_SECRET).update(identity).digest('hex'); keys.push(...users.flatMap((user) => ['ticket-write:user','staff:user'].map((bucket) => `portal:rate:${bucket}:${hash(user.id)}`)), ...['ticket-write:ip','staff:ip'].map((bucket) => `portal:rate:${bucket}:${hash(ip)}`)); }
			if (keys.length) await command(['DEL', ...keys]);
		} catch { clean = false; }
		if (journaled && clean) { try { await command(['DEL', `portal:provider-verification:journal:${runId}`]); } catch { clean = false; } }
		result.cleanup = { passed: clean, attemptedUsers: journaled ? users.length : 0, createdUsers: users.filter((user) => user.created).length, removedUsers: clean ? users.filter((user) => user.created).length : null }; if (!clean) { result.cleanup.temporaryUserIds = users.map((user) => user.id); result.cleanup.journalId = runId; }
		result.passed = !failed && clean; result.finishedAt = new Date().toISOString();
	}
	return result;
}

async function recoverVerification(runId, { command = redisCommand, request = providerRequest } = {}) {
	assert(UUID.test(runId));
	const journal = JSON.parse(await command(['GET', `portal:provider-verification:journal:${runId}`]));
	assert(journal?.runId === runId && journal.userIds?.length === 2 && journal.userIds.every((id) => UUID.test(id)) && Array.isArray(journal.writeKeys));
	assert(journal.writeKeys.every((key) => journal.userIds.some((id) => new RegExp(`^portal:(ticket-write|staff-write):${id}:provider_[a-f0-9]{32}$`).test(key))));
	let passed = true;
	for (const id of journal.userIds) {
		for (const operation of [() => request(`/rest/v1/staff_audit_events?actor_id=eq.${id}`, { admin: true, method: 'DELETE' }), () => request(`/auth/v1/admin/users/${id}`, { admin: true, method: 'DELETE' })]) { try { const response = await operation(); assert(response.ok || response.status === 404); } catch { passed = false; } }
		try { const response = await request(`/auth/v1/admin/users/${id}`, { admin: true }); assert(response.status === 404); } catch { passed = false; }
		for (const path of [`profiles?id=eq.${id}&select=id`, `tickets?user_id=eq.${id}&select=id`, `ticket_messages?author_id=eq.${id}&select=id`, `user_roles?user_id=eq.${id}&select=user_id`, `activity_events?user_id=eq.${id}&select=id`, `staff_audit_events?actor_id=eq.${id}&select=id`]) {
			try { const response = await request(`/rest/v1/${path}`, { admin: true }); assert(response.ok && response.data?.length === 0); } catch { passed = false; }
		}
	}
	try {
		assert(process.env.PORTAL_RATE_LIMIT_SECRET);
		const hash = (identity) => crypto.createHmac('sha256', process.env.PORTAL_RATE_LIMIT_SECRET).update(identity).digest('hex');
		const keys = journal.writeKeys.flatMap((key) => [key, `${key}:lock`]);
		keys.push(...journal.userIds.flatMap((id) => ['ticket-write:user','staff:user'].map((bucket) => `portal:rate:${bucket}:${hash(id)}`)), ...['ticket-write:ip','staff:ip'].map((bucket) => `portal:rate:${bucket}:${hash(`provider-${runId}`)}`));
		await command(['DEL', ...keys]);
	} catch { passed = false; }
	if (passed) await command(['DEL', `portal:provider-verification:journal:${runId}`]);
	return { passed, recovery: true, journalId: runId, cleanup: { passed, attemptedUsers: 2 } };
}

async function handleProviderVerification(req, res) {
	res.setHeader('Cache-Control', 'no-store, private');
	if (!allowed(req)) return res.status(404).json({ error: 'Not found' });
	const owner = crypto.randomUUID(); let acquired = false;
	try {
		acquired = await redisCommand(['SET', LOCK, owner, 'NX', 'EX', 600]) === 'OK';
		if (!acquired) return res.status(409).json({ error: 'An isolated verification is already running.' });
		const result = req.body?.recoveryRunId ? await recoverVerification(req.body.recoveryRunId) : await runVerification({ runId: req.body?.runId }); return res.status(result.passed ? 200 : 500).json(result);
	} catch { return res.status(503).json({ passed: false, error: 'Isolated provider verification is unavailable.' }); }
	finally { if (acquired) await redisCommand(['EVAL', "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end", 1, LOCK, owner]).catch(() => {}); }
}

module.exports = { allowed, handleProviderVerification, runVerification, recoverVerification, totpCode };
