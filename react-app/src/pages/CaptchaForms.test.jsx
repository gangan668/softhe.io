import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Contact from './Contact';
import Withdrawal from './Withdrawal';
import { submitContactForm } from '../utils/contact';
import { submitWithdrawal } from '../utils/withdrawal';
import { SafeMessageError } from '../utils/userErrors';

const { resetSpy, testConfig } = vi.hoisted(() => ({
	resetSpy: vi.fn(),
	testConfig: { enabled: true, siteKey: 'test-site-key', configured: true },
}));

vi.mock('../utils/captcha', async (importOriginal) => ({
	...(await importOriginal()),
	captchaConfig: testConfig,
}));

vi.mock('@marsidev/react-turnstile', async () => {
	const React = await vi.importActual('react');
	return {
		Turnstile: function MockTurnstile({ ref, onSuccess, onExpire, siteKey, options }) {
			React.useImperativeHandle(ref, () => ({ reset: resetSpy }));
			return (
				<>
					<button type="button" data-site-key={siteKey} data-theme={options?.theme} onClick={() => onSuccess('turnstile-token')}>
						Solve security check
					</button>
					<button type="button" onClick={onExpire}>Expire security check</button>
				</>
			);
		},
	};
});

vi.mock('../utils/contact', () => ({ submitContactForm: vi.fn() }));
vi.mock('../utils/withdrawal', () => ({ submitWithdrawal: vi.fn() }));
vi.mock('../utils/runtimeConfig', async (importOriginal) => ({
	...(await importOriginal()),
	contactFormEnabled: true,
}));
vi.mock('../hooks/useRateLimit', () => ({
	default: () => ({
		isBlocked: false,
		attemptsLeft: 3,
		attempt: async (action) => {
			await action();
			return true;
		},
		getBlockMessage: () => 'Rate limit exceeded',
	}),
}));

const CAPTCHA_FAILED = 'Security verification failed. Please try again.';

const fillContact = async (user) => {
	await user.type(screen.getByLabelText(/Full Name/i), 'John Doe');
	await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
	await user.selectOptions(screen.getByLabelText(/Subject/i), 'general');
	await user.type(screen.getByLabelText(/^Message/i), 'This is a test message with enough characters');
};

const fillWithdrawal = async (user) => {
	await user.type(screen.getByLabelText(/Order reference/i), 'cs_test_12345678');
	await user.type(screen.getByLabelText(/Email used for the order/i), 'jane@example.com');
};

describe('Turnstile-protected forms', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Object.assign(testConfig, { enabled: true, siteKey: 'test-site-key', configured: true });
		submitContactForm.mockResolvedValue({ delivered: true });
		submitWithdrawal.mockResolvedValue({ requestId: 'WR-123' });
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	it('keeps contact submit disabled until a token exists, sends it, then resets the widget', async () => {
		const user = userEvent.setup();
		render(<MemoryRouter><Contact /></MemoryRouter>);
		await fillContact(user);
		const submit = screen.getByRole('button', { name: /Send message/i });
		expect(submit).toBeDisabled();
		expect(screen.getByRole('button', { name: /Solve security check/i })).toHaveAttribute('data-theme', 'dark');

		await user.click(screen.getByRole('button', { name: /Solve security check/i }));
		expect(submit).toBeEnabled();
		await user.click(screen.getByRole('button', { name: /Expire security check/i }));
		expect(submit).toBeDisabled();
		expect(screen.getByRole('alert')).toHaveTextContent('Security verification expired. Complete the check again.');

		await user.click(screen.getByRole('button', { name: /Solve security check/i }));
		await user.click(submit);

		await screen.findByRole('status', { name: /Thank you for your message/i });
		expect(submitContactForm).toHaveBeenCalledWith(expect.objectContaining({ captchaToken: 'turnstile-token' }), '');
		expect(resetSpy).toHaveBeenCalledTimes(1);
		expect(submit).toBeDisabled();
	});

	it('surfaces a rejected contact security verification and requires a fresh token', async () => {
		submitContactForm.mockRejectedValue(new SafeMessageError(CAPTCHA_FAILED));
		const user = userEvent.setup();
		render(<MemoryRouter><Contact /></MemoryRouter>);
		await fillContact(user);
		await user.click(screen.getByRole('button', { name: /Solve security check/i }));
		await user.click(screen.getByRole('button', { name: /Send message/i }));

		expect(await screen.findByRole('alert', { name: CAPTCHA_FAILED })).toBeInTheDocument();
		expect(resetSpy).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(screen.getByRole('button', { name: /Send message/i })).toBeDisabled());
	});

	it('hides raw non-API contact errors', async () => {
		submitContactForm.mockRejectedValue(new Error('SMTP relay 10.0.0.4 refused'));
		const user = userEvent.setup();
		render(<MemoryRouter><Contact /></MemoryRouter>);
		await fillContact(user);
		await user.click(screen.getByRole('button', { name: /Solve security check/i }));
		await user.click(screen.getByRole('button', { name: /Send message/i }));

		expect(await screen.findByRole('alert', { name: /An error occurred. Please contact/i })).toBeInTheDocument();
		expect(screen.queryByText(/SMTP relay/)).not.toBeInTheDocument();
	});

	it('sends the withdrawal token and does not claim an email was definitely sent', async () => {
		const user = userEvent.setup();
		render(<MemoryRouter><Withdrawal /></MemoryRouter>);
		await fillWithdrawal(user);
		const submit = screen.getByRole('button', { name: /Confirm withdrawal request/i });
		expect(submit).toBeDisabled();

		await user.click(screen.getByRole('button', { name: /Solve security check/i }));
		await user.click(submit);

		const status = await screen.findByRole('status');
		expect(status).toHaveTextContent("If the order reference and email match our records, you'll receive a confirmation email. Your request ID is WR-123.");
		expect(status).not.toHaveTextContent(/will be sent/i);
		expect(submitWithdrawal).toHaveBeenCalledWith(expect.objectContaining({ captchaToken: 'turnstile-token', email: 'jane@example.com' }));
		expect(resetSpy).toHaveBeenCalledTimes(1);
		expect(submit).toBeDisabled();
	});

	it('shows the withdrawal security verification failure and resets the widget', async () => {
		submitWithdrawal.mockRejectedValue(new SafeMessageError(CAPTCHA_FAILED));
		const user = userEvent.setup();
		render(<MemoryRouter><Withdrawal /></MemoryRouter>);
		await fillWithdrawal(user);
		await user.click(screen.getByRole('button', { name: /Solve security check/i }));
		await user.click(screen.getByRole('button', { name: /Confirm withdrawal request/i }));

		expect(await screen.findByRole('alert')).toHaveTextContent(CAPTCHA_FAILED);
		expect(resetSpy).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('button', { name: /Confirm withdrawal request/i })).toBeDisabled();
	});

	it('fails closed when captcha is enabled without a site key', async () => {
		Object.assign(testConfig, { siteKey: '', configured: false });
		const user = userEvent.setup();
		const { unmount } = render(<MemoryRouter><Withdrawal /></MemoryRouter>);
		await fillWithdrawal(user);
		expect(screen.getByRole('alert')).toHaveTextContent('Security verification is not configured.');
		expect(screen.getByRole('button', { name: /Confirm withdrawal request/i })).toBeDisabled();
		unmount();

		render(<MemoryRouter><Contact /></MemoryRouter>);
		await fillContact(user);
		expect(screen.getByRole('alert')).toHaveTextContent('Security verification is not configured.');
		expect(screen.getByRole('button', { name: /Send message/i })).toBeDisabled();
		expect(submitContactForm).not.toHaveBeenCalled();
		expect(submitWithdrawal).not.toHaveBeenCalled();
	});

	it('renders no widget and sends an empty token when captcha is disabled', async () => {
		Object.assign(testConfig, { enabled: false, siteKey: '', configured: false });
		const user = userEvent.setup();
		render(<MemoryRouter><Withdrawal /></MemoryRouter>);
		await fillWithdrawal(user);
		expect(screen.queryByRole('button', { name: /Solve security check/i })).not.toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: /Confirm withdrawal request/i }));
		await screen.findByRole('status');
		expect(submitWithdrawal).toHaveBeenCalledWith(expect.objectContaining({ captchaToken: '' }));
		expect(resetSpy).not.toHaveBeenCalled();
	});
});
