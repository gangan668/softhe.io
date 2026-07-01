import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from '../context/CartProvider';
import Checkout from './Checkout';

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

	it('renders static-site bundle fallback for multiple items', () => {
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

		expect(screen.getByText(/Bundle checkout uses manual invoicing/i)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /request bundle invoice/i })).toHaveAttribute('href', '/contact');
		expect(screen.getByRole('button', { name: /pay for custom windows 10 iso/i })).toBeInTheDocument();
	});
});

