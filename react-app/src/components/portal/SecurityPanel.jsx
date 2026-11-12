import { passwordRequirements } from '../../utils/passwordPolicy';

function PasswordChange({ flow, onRequestCode, onSubmit }) {
	if (flow.step !== 'code-sent') {
		return (
			<div className="portal-form">
				<p>To change your password, we first email you a one-time verification code.</p>
				<button type="button" className="btn btn-primary" onClick={onRequestCode} disabled={flow.sending}>
					{flow.sending ? 'Sending…' : 'Send verification code'}
				</button>
			</div>
		);
	}
	return (
		<form className="portal-form" onSubmit={onSubmit}>
			<label>
				Verification code
				<input
					name="code"
					inputMode="numeric"
					autoComplete="one-time-code"
					pattern="[0-9]{6,10}"
					maxLength="10"
					required
				/>
				<small>Enter the code from the email we just sent you.</small>
			</label>
			<label>
				New password
				<input name="password" type="password" minLength="12" autoComplete="new-password" required />
				<small>{passwordRequirements}</small>
			</label>
			<button className="btn btn-primary" disabled={flow.saving}>
				{flow.saving ? 'Please wait…' : 'Change password'}
			</button>
			<button type="button" className="btn btn-secondary" onClick={onRequestCode} disabled={flow.sending || flow.saving}>
				{flow.sending ? 'Sending…' : 'Send a new code'}
			</button>
		</form>
	);
}

function MfaSetup({ mfa, onBegin, onVerify, onCodeChange }) {
	return (
		<>
			<h3>Authenticator app</h3>
			<p>Staff access requires a verified authenticator and an AAL2 session.</p>
			{mfa.error && <div className="portal-error" role="alert">{mfa.error}</div>}
			{mfa.message && <div className="portal-success" role="status">{mfa.message}</div>}
			{mfa.qr && <img src={mfa.qr} alt="Authenticator enrollment QR code" width="220" height="220" />}
			{!mfa.factorId ? (
				<button className="btn btn-secondary" onClick={onBegin}>Set up or verify MFA</button>
			) : (
				<form className="portal-form" onSubmit={onVerify}>
					<label>
						Six-digit code
						<input
							value={mfa.code}
							onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
							inputMode="numeric"
							autoComplete="one-time-code"
							pattern="[0-9]{6}"
							required
						/>
					</label>
					<button className="btn btn-primary">Verify MFA</button>
				</form>
			)}
		</>
	);
}

export default function SecurityPanel({ passwordFlow, onRequestPasswordCode, onUpdatePassword, mfa, onBeginMfa, onVerifyMfa, onMfaCodeChange }) {
	return (
		<section className="portal-card narrow-card">
			<h2>Security</h2>
			<p>Your password is managed securely by Supabase and is never stored by Softhe.io.</p>
			<PasswordChange flow={passwordFlow} onRequestCode={onRequestPasswordCode} onSubmit={onUpdatePassword} />
			<hr />
			<MfaSetup mfa={mfa} onBegin={onBeginMfa} onVerify={onVerifyMfa} onCodeChange={onMfaCodeChange} />
		</section>
	);
}
