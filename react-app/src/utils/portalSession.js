const FUTURE_JWT_PATTERN = /jwt issued at future/i;

export const findPortalError = (results) => results.find((result) => result?.error)?.error || null;

export const isFutureJwtError = (error) => FUTURE_JWT_PATTERN.test(String(error?.message || ''));

export async function runPortalQueriesWithSessionRecovery(supabase, runQueries) {
	let results = await runQueries();
	let error = findPortalError(results);
	if (!isFutureJwtError(error)) return { results, error, sessionInvalid: false, refreshed: false };

	const refresh = await supabase.auth.refreshSession();
	if (refresh.error || !refresh.data?.session) {
		return {
			results,
			error: new Error('Your session could not be refreshed. Please sign in again.'),
			sessionInvalid: true,
			refreshed: false,
		};
	}

	results = await runQueries();
	error = findPortalError(results);
	if (isFutureJwtError(error)) {
		return {
			results,
			error: new Error('Your session is not valid yet. Please sign in again.'),
			sessionInvalid: true,
			refreshed: true,
		};
	}
	return { results, error, sessionInvalid: false, refreshed: true };
}
