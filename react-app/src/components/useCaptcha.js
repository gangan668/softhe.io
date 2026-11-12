import { useCallback, useState } from 'react';
import { captchaConfig } from '../utils/captcha';

/**
 * State for a single-use Turnstile token. The caller owns `ref` (pass the same
 * ref to <Captcha ref={...}>) so `reset()` can clear the widget after a submit.
 * `blocking` is true while captcha is enabled and no usable token exists.
 */
export default function useCaptcha(ref, config = captchaConfig) {
	const [token, setToken] = useState('');
	const onToken = useCallback((value) => setToken(typeof value === 'string' ? value : ''), []);
	const reset = useCallback(() => {
		ref.current?.reset();
		setToken('');
	}, [ref]);
	return {
		config,
		token,
		onToken,
		reset,
		enabled: config.enabled,
		blocking: config.enabled && (!config.siteKey || !token),
	};
}
