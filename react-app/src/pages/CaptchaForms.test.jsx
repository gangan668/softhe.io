import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Contact from './Contact';
import Withdrawal from './Withdrawal';
import { submitContactForm } from '../utils/contact';
import { submitWithdrawal } from '../utils/withdrawal';
import { SafeMessageError } from '../utils/userErrors';

const { resetSpy } = vi.hoisted(() => ({ resetSpy: vi.fn() }));

vi.mock('../utils/captcha', async (importOriginal) => ({
	...(await importOriginal()),
	captchaConfig: { enabled: true, siteKey: 'test-site-key', configured: true },
}));

vi.mock('@marsidev/react-turnstile', async () => {
	const React = await vi.importActual('react');
	return {
		Turnstile: function MockTurnstile({ ref, onSuccess, siteKey, options }) {
			React.useImperativeHandle(ref, () => ({ reset: resetSpy }));
			return (
				<button type="button" data-site-key={siteKey} data-theme={options?.theme} onClick={() => onSuccess('turnstile-token')}>
					Solve security check
				</button>
			);
		},
	};
});

vi.mock('../utils/contact', () => ({ submitContactForm: vi.fn() }));
vi.mock('../utils/withdrawal', () => ({ submitWithdrawal: vi.fn() }));
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

const fillContact = async (user) => {
	await user.type(screen.getByLabelText(/Full Name/i), 'John Doe');
	await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
	await user.selectOptions(screen.getByLabelText(/Subject/i), 'general');
	await user.type(screen.getByLabelText(/^Message/i), 'This is a test message with enough characters');
};

describe('Turnstile-protected forms', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		submitContactForm.mockResolvedValue({ delivered: true });
		submitWithdrawal.mockResolvedValue({ requestId: 'WR-123' });
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
		await user.click(submit);

		await screen.findByRole('status', { name: /Thank you for your message/i });
		expect(submitContactForm).toHaveBeenCalledWith(expect.objectContaining({ captchaToken: 'turnstile-token' }), '');
		expect(resetSpy).toHaveBeenCalledTimes(1);
		expect(submit).toBeDisabled();
	});

	it('surfaces a rejected security verification and requires a fresh token', async () => {
		submitContactForm.mockRejectedValue(new SafeMessageError('Security verification failed. Please try again.'));
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const user = userEvent.setup();
		render(<MemoryRouter><Contact /></MemoryRouter>);
		await fillContact(user);
		await user.click(screen.getByRole('button', { name: /Solve security check/i }));
		await user.click(screen.getByRole('button', { name: /Send message/i }));

		expect(await screen.findByRole('alert', { name: 'Security verification failed. Please try again.' })).toBeInTheDocument();
		expect(resetSpy).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(screen.getByRole('button', { name: /Send message/i })).toBeDisabled());
	});

	it('sends the withdrawal token and does not claim an email was definitely sent', async () => {
		const user = userEvent.setup();
		render(<MemoryRouter><Withdrawal /></MemoryRouter>);
		await user.type(screen.getByLabelText(/Order reference/i), 'cs_test_12345678');
		await user.type(screen.getByLabelText(/Email used for the order/i), 'jane@example.com');
		const submit = screen.getByRole('button', { name: /Confirm withdrawal request/i });
		expect(submit).toBeDisabled();

		await user.click(screen.getByRole('button', { name: /Solve security check/i }));
		await user.click(submit);

		const status = await screen.findByRole('status');
		expect(status).toHaveTextContent("If the order reference and email match our records, you'll receive a confirmation email. Your request ID is WR-123.");
		expect(submitWithdrawal).toHaveBeenCalledWith(expect.objectContaining({ captchaToken: 'turnstile-token', email: 'jane@example.com' }));
		expect(resetSpy).toHaveBeenCalledTimes(1);
		expect(submit).toBeDisabled();
	});
});
