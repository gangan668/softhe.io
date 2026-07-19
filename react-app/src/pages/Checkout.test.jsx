import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from '../context/CartProvider';
import Checkout from './Checkout';
import { createCheckoutSession } from '../utils/checkout';

vi.mock('../utils/checkout', () => ({ createCheckoutSession: vi.fn() }));
vi.mock('../utils/analytics', () => ({ trackEvent: vi.fn() }));

const renderCheckout = (cart) => {
	localStorage.setItem('softhe_cart', JSON.stringify(cart));
	return render(
		<MemoryRouter initialEntries={['/checkout']}>
			<CartProvider>
				<Routes>
					<Route path="/checkout" element={<Checkout />} />
					<Route path="/store" element={<div>Store Redirect</div>} />
				</Routes>
			</CartProvider>
		</MemoryRouter>
	);
};

describe('Checkout', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it('renders a Stripe payment button for a single item', () => {
		renderCheckout([
			{
				id: 'windows-10',
				name: 'Custom Windows 10 ISO',
				price: 65,
				icon: 'fab fa-windows',
				quantity: 1,
			},
		]);

		expect(screen.getByText('Custom Windows 10 ISO')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /pay securely with stripe/i })).toBeInTheDocument();
	});

	it('renders server-backed Stripe checkout for multiple items', () => {
		renderCheckout([
			{
				id: 'windows-10',
				name: 'Custom Windows 10 ISO',
				price: 65,
				icon: 'fab fa-windows',
				quantity: 1,
			},
			{
				id: 'bios-optimization',
				name: 'BIOS Optimization Service',
				price: 50,
				icon: 'fas fa-microchip',
				quantity: 1,
			},
		]);

		expect(screen.getByText(/Bundle discount applied/i)).toBeInTheDocument();
		expect(screen.getByText(/Bundle discount \(5%\)/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /pay securely with stripe/i })).toBeInTheDocument();
		expect(screen.queryByText(/manual invoicing/i)).not.toBeInTheDocument();
	});

	it('shows server checkout failures and allows retrying', async () => {
		createCheckoutSession.mockRejectedValueOnce(new Error('Checkout is temporarily unavailable'));
		const user = userEvent.setup();
		renderCheckout([{ id: 'windows-10', quantity: 1 }]);

		const button = screen.getByRole('button', { name: /pay securely with stripe/i });
		await user.click(button);

		expect(await screen.findByRole('alert')).toHaveTextContent('Checkout is temporarily unavailable');
		expect(button).toBeEnabled();
		expect(createCheckoutSession).toHaveBeenCalledWith([
			expect.objectContaining({ id: 'windows-10', quantity: 1 }),
		]);
	});

	it('updates and removes checkout items', async () => {
		const user = userEvent.setup();
		renderCheckout([{ id: 'windows-10', quantity: 1 }]);

		await user.click(screen.getByRole('button', { name: /increase quantity/i }));
		expect(screen.getAllByText('€130.00')).toHaveLength(2);

		await user.click(screen.getByRole('button', { name: /remove custom windows 10 iso/i }));
		expect(await screen.findByText('Store Redirect')).toBeInTheDocument();
	});
});

