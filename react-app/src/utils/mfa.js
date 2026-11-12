const tokenClaims = (token) => {
	try {
		const payload = String(token).split('.')[1] || '';
		const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
		return JSON.parse(atob(base64));
	} catch { return {}; }
};

export const hasVerifiedFactor = (user) => Array.isArray(user?.factors) && user.factors.some((factor) => factor?.status === 'verified');

// True when the account has a verified factor but this session has not used it.
// The server and database enforce the same rule; this only drives the interface.
export const mfaStepRequired = (session) => Boolean(session?.access_token && hasVerifiedFactor(session.user) && tokenClaims(session.access_token).aal !== 'aal2');
