const { getBearerToken, getConfig, verifyUser } = require('./_lib/supabase');
const { jsonOnly, sendPublicError } = require('./_lib/portal-security');
const { fetchWithTimeout } = require('./_lib/fetch');

module.exports = async function sessionRevokeOthers(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
	try {
		jsonOnly(req);
		await verifyUser(req);
		const { url, publishableKey } = getConfig();
		const response = await fetchWithTimeout(`${url}/auth/v1/logout?scope=others`, { method: 'POST', headers: { apikey: publishableKey, Authorization: `Bearer ${getBearerToken(req)}` } });
		if (!response.ok) throw new Error('Session revocation failed');
		return res.status(200).json({ revoked: true });
	} catch (error) { return sendPublicError(res, error, 'Other sessions could not be revoked'); }
};
