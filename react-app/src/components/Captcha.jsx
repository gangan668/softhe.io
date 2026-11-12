import { Turnstile } from '@marsidev/react-turnstile';
import { CAPTCHA_NOT_CONFIGURED_MESSAGE, captchaConfig } from '../utils/captcha';
import './Captcha.css';

/**
 * Cloudflare Turnstile widget shared by the auth, contact and withdrawal forms.
 * Pass a ref to call `ref.current.reset()` after each submit (tokens are single-use).
 * `onToken` receives the token, or '' when it expires or errors.
 * `className` / `errorClassName` replace the default widget and error styles.
 */
export default function Captcha({ ref, onToken, config = captchaConfig, className = '', errorClassName = '' }) {
	if (!config.enabled) return null;
	if (!config.siteKey) {
		return (
			<div className={errorClassName || 'captcha-error'} role="alert">
				{CAPTCHA_NOT_CONFIGURED_MESSAGE}
			</div>
		);
	}
	const emit = (token) => onToken?.(typeof token === 'string' ? token : '');
	return (
		<div className={className || 'captcha-widget'}>
			<Turnstile
				ref={ref}
				siteKey={config.siteKey}
				onSuccess={emit}
				onExpire={() => emit('')}
				onError={() => emit('')}
				options={{ theme: 'dark' }}
			/>
		</div>
	);
}
