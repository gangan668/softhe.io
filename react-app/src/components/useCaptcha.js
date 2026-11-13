import { useCallback, useRef, useState } from 'react';
import { captchaConfig } from '../utils/captcha';

/**
 * State for a single-use Turnstile token, shared by the auth, contact and
 * withdrawal forms. Pass the returned object to <Captcha captcha={...} />.
 * Call `reset()` after every submit attempt: tokens cannot be reused.
 * `blocking` is true while captcha is enabled and no usable token exists.
 */
export default function useCaptcha(config = captchaConfig) {
	const ref = useRef(null);
	const [token, setToken] = useState('');
	const [error, setError] = useState('');
	const accept = useCallback((value) => {
		setToken(typeof value === 'string' ? value : '');
		setError('');
	}, []);
	const fail = useCallback((message) => {
		setToken('');
		setError(message);
	}, []);
	const reset = useCallback(() => {
		setToken('');
		setError('');
		ref.current?.reset();
	}, []);
	return {
		ref,
		config,
		token,
		error,
		accept,
		fail,
		reset,
		enabled: config.enabled,
		blocking: config.enabled && (!config.siteKey || !token),
	};
}
