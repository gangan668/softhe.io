import { useState } from 'react';
import Captcha from '../components/Captcha';
import useCaptcha from '../components/useCaptcha';
import { siteConfig } from '../config/site';
import { CAPTCHA_REQUIRED_MESSAGE } from '../utils/captcha';
import { getUserErrorMessage } from '../utils/userErrors';
import { submitWithdrawal } from '../utils/withdrawal';
import './Legal.css';
import './Withdrawal.css';

const ITEM_OPTIONS = [
	{ id: 'entire-order', label: 'The entire order' },
	{ id: 'windows-10', label: 'Custom Windows 10 ISO' },
	{ id: 'windows-11', label: 'Custom Windows 11 ISO' },
	{ id: 'bios-optimization', label: 'BIOS Optimization Service' },
];

function Withdrawal() {
	const [form, setForm] = useState({
		orderReference: '',
		email: '',
		requestedItems: ['entire-order'],
		comments: '',
		website: '',
	});
	const [status, setStatus] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const captcha = useCaptcha();

	const toggleItem = (itemId) => {
		setForm((current) => {
			if (itemId === 'entire-order') return { ...current, requestedItems: ['entire-order'] };
			const withoutEntireOrder = current.requestedItems.filter((item) => item !== 'entire-order');
			const requestedItems = withoutEntireOrder.includes(itemId)
				? withoutEntireOrder.filter((item) => item !== itemId)
				: [...withoutEntireOrder, itemId];
			return { ...current, requestedItems };
		});
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (captcha.blocking) {
			setStatus({ type: 'error', message: CAPTCHA_REQUIRED_MESSAGE });
			return;
		}
		setSubmitting(true);
		setStatus(null);
		try {
			const result = await submitWithdrawal({ ...form, captchaToken: captcha.token });
			setStatus({
				type: 'success',
				// The server answers identically whether or not the order matched,
				// so never claim that an email was definitely sent.
				message: `If the order reference and email match our records, you'll receive a confirmation email.${result?.requestId ? ` Your request ID is ${result.requestId}.` : ''}`,
			});
			setForm((current) => ({ ...current, comments: '', website: '' }));
		} catch (error) {
			setStatus({ type: 'error', message: getUserErrorMessage(error, 'The withdrawal request could not be confirmed.') });
		} finally {
			if (captcha.enabled) captcha.reset();
			setSubmitting(false);
		}
	};

	return (
		<>
			<div className="legal-page withdrawal-page">
				<section className="page-header">
					<div className="container">
						<h1>Withdraw from an Order</h1>
						<p>Use this function to notify Softhe.io that you want to withdraw from an eligible distance contract.</p>
					</div>
				</section>
				<section className="legal-content">
					<div className="container withdrawal-layout">
						<div className="legal-card withdrawal-guidance">
							<h2>Before you submit</h2>
							<p>Submitting this form records when the request was received. Eligibility and consequences depend on the product, delivery status, and mandatory consumer law.</p>
							<p>Digital delivery or a requested service may affect the right of withdrawal after performance has begun. Your statutory complaint rights are separate and are not limited by this form.</p>
							<p>If the form is unavailable, email <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a> with the same order details.</p>
						</div>
						<form className="legal-card withdrawal-form" onSubmit={handleSubmit}>
							<h2>Withdrawal request</h2>
							<input
								className="withdrawal-honeypot"
								type="text"
								name="website"
								value={form.website}
								onChange={(event) => setForm({ ...form, website: event.target.value })}
								tabIndex="-1"
								autoComplete="off"
								aria-hidden="true"
							/>
							<label htmlFor="order-reference">Order reference *</label>
							<input
								id="order-reference"
								name="orderReference"
								value={form.orderReference}
								onChange={(event) => setForm({ ...form, orderReference: event.target.value })}
								placeholder="Stripe or Softhe order reference"
								minLength="8"
								maxLength="100"
								required
							/>
							<label htmlFor="withdrawal-email">Email used for the order *</label>
							<input
								id="withdrawal-email"
								name="email"
								type="email"
								value={form.email}
								onChange={(event) => setForm({ ...form, email: event.target.value })}
								maxLength="100"
								required
							/>
							<fieldset>
								<legend>What do you want to withdraw? *</legend>
								{ITEM_OPTIONS.map((item) => (
									<label key={item.id} className="withdrawal-option">
										<input
											type="checkbox"
											checked={form.requestedItems.includes(item.id)}
											onChange={() => toggleItem(item.id)}
										/>
										<span>{item.label}</span>
									</label>
								))}
							</fieldset>
							<label htmlFor="withdrawal-comments">Additional information</label>
							<textarea
								id="withdrawal-comments"
								name="comments"
								rows="5"
								value={form.comments}
								onChange={(event) => setForm({ ...form, comments: event.target.value })}
								maxLength="2000"
							/>
							<Captcha captcha={captcha} />
							<button
								className="btn btn-primary"
								type="submit"
								disabled={submitting || form.requestedItems.length === 0 || captcha.blocking}
							>
								{submitting ? 'Submitting…' : 'Confirm withdrawal request'}
							</button>
							{status && (
								<div className={`withdrawal-status ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>
									{status.message}
								</div>
							)}
						</form>
					</div>
				</section>
			</div>
		</>
	);
}

export default Withdrawal;
