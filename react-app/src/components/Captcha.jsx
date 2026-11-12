import { Turnstile } from '@marsidev/react-turnstile';
import {
	CAPTCHA_ERROR_MESSAGE,
	CAPTCHA_EXPIRED_MESSAGE,
	CAPTCHA_NOT_CONFIGURED_MESSAGE,
	CAPTCHA_TIMEOUT_MESSAGE,
	CAPTCHA_UNSUPPORTED_MESSAGE,
} from '../utils/captcha';
import './Captcha.css';

/**
 * Cloudflare Turnstile widget driven by the state from useCaptcha().
 * Renders nothing when captcha is disabled, and fails closed with an alert when
 * it is enabled without a site key. `className` / `errorClassName` replace the
 * default widget and error styles so each form can keep its own look.
 */
export default function Captcha({ captcha, className = '', errorClassName = '' }) {
	const { config, ref, accept, fail, reset, error } = captcha;
	if (!config.enabled) return null;
	const errorClass = errorClassName || 'captcha-error';
	if (!config.siteKey) {
		return (
			<div className={errorClass} role="alert">
				{CAPTCHA_NOT_CONFIGURED_MESSAGE}
			</div>
		);
	}
	return (
		<div className={className || 'captcha-widget'}>
			<Turnstile
				ref={ref}
				siteKey={config.siteKey}
				onSuccess={accept}
				onExpire={() => fail(CAPTCHA_EXPIRED_MESSAGE)}
				onError={() => fail(CAPTCHA_ERROR_MESSAGE)}
				onTimeout={() => fail(CAPTCHA_TIMEOUT_MESSAGE)}
				onUnsupported={() => fail(CAPTCHA_UNSUPPORTED_MESSAGE)}
				options={{ theme: 'dark' }}
			/>
			{error && (
				<div className={errorClass} role="alert">
					{error}
					<button type="button" className="btn btn-secondary" onClick={reset}>
						Retry security check
					</button>
				</div>
			)}
		</div>
	);
}
