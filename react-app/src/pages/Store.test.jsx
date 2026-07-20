import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../context/CartProvider';
import { verifyCheckoutSession } from '../utils/checkout';
import Store from './Store';

vi.mock('../utils/checkout', () => ({ verifyCheckoutSession: vi.fn() }));

const renderStore = (initialEntry = '/store') =>
	render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<CartProvider>
				<Store />
			</CartProvider>
		</MemoryRouter>
	);

describe('Store', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it('renders product cards and recommendation helper', () => {
		renderStore();

		expect(screen.getAllByText('Custom Windows 10 ISO').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText('Custom Windows 11 ISO').length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText('BIOS Optimization Service')).toBeInTheDocument();
		expect(screen.getByText('Which product should I start with?')).toBeInTheDocument();
		expect(screen.getByText('Server-validated checkout')).toBeInTheDocument();
		expect(screen.getByText('Automatic bundle discounts')).toBeInTheDocument();
	});

	it('updates the product recommendation', async () => {
		const user = userEvent.setup();
		renderStore();

		await user.click(screen.getByRole('button', { name: /newer pc/i }));

		expect(screen.getAllByText('Custom Windows 11 ISO').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/Newer systems that need current Windows 11/i).length).toBeGreaterThanOrEqual(1);
	});

	it('adds a product to the cart', async () => {
		const user = userEvent.setup();
		renderStore();

		await user.click(screen.getAllByRole('button', { name: /add to cart/i })[0]);

		expect(screen.getByRole('button', { name: /added to cart/i })).toBeInTheDocument();
		expect(JSON.parse(localStorage.getItem('softhe_cart'))).toHaveLength(1);
	});

	it('starts the buy-now path with a server-authoritative cart item', async () => {
		const user = userEvent.setup();
		renderStore();
		await user.click(screen.getAllByRole('button', { name: /buy now/i })[0]);
		expect(JSON.parse(localStorage.getItem('softhe_cart'))).toEqual([
			expect.objectContaining({ id: 'windows-10', quantity: 1 }),
		]);
	});

	it('clears the cart only after the server verifies a paid session', async () => {
		localStorage.setItem('softhe_cart', JSON.stringify([{ id: 'windows-10', quantity: 1 }]));
		verifyCheckoutSession.mockResolvedValue({
			id: 'cs_test_12345678',
			paid: true,
			status: 'complete',
			amountTotal: 6500,
			currency: 'eur',
			items: [{ id: 'windows-10', quantity: 1 }],
		});
		renderStore('/store?checkout=success&session_id=cs_test_12345678');

		expect(await screen.findByText('Order confirmed')).toBeInTheDocument();
		await waitFor(() => {
			expect(JSON.parse(localStorage.getItem('softhe_cart'))).toEqual([]);
		});
	});

	it('keeps the cart while payment is unverified or processing', async () => {
		localStorage.setItem('softhe_cart', JSON.stringify([{ id: 'windows-10', quantity: 1 }]));
		verifyCheckoutSession.mockResolvedValue({
			id: 'cs_test_12345678',
			paid: false,
			status: 'processing',
			items: [{ id: 'windows-10', quantity: 1 }],
		});
		renderStore('/store?checkout=success&session_id=cs_test_12345678');

		expect(await screen.findByText(/payment is still processing/i)).toBeInTheDocument();
		expect(JSON.parse(localStorage.getItem('softhe_cart'))).toEqual([{ id: 'windows-10', quantity: 1 }]);
	});

	it('shows safe verification errors for missing and rejected sessions', async () => {
		const firstRender = renderStore('/store?checkout=success');
		expect(await screen.findByText(/could not verify this checkout/i)).toBeInTheDocument();
		firstRender.unmount();

		verifyCheckoutSession.mockRejectedValue(new Error('Verification service unavailable.'));
		renderStore('/store?checkout=success&session_id=cs_test_12345678');
		expect(await screen.findByText(/Verification service unavailable/i)).toBeInTheDocument();
	});
});
