import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../context/CartProvider';
import Cart from './Cart';

const renderCart = (cart = []) => {
	localStorage.setItem('softhe_cart', JSON.stringify(cart));
	return render(
		<MemoryRouter>
			<CartProvider>
				<Cart isOpen={true} onClose={vi.fn()} />
			</CartProvider>
		</MemoryRouter>
	);
};

describe('Cart', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it('renders the empty cart state', () => {
		renderCart();

		expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /browse products/i })).toHaveAttribute('href', '/store');
	});

	it('falls back to an empty cart when stored cart data is invalid', () => {
		localStorage.setItem('softhe_cart', 'not-json');

		render(
			<MemoryRouter>
				<CartProvider>
					<Cart isOpen={true} onClose={vi.fn()} />
				</CartProvider>
			</MemoryRouter>
		);

		expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
	});

	it('renders cart items and total', async () => {
		const user = userEvent.setup();
		renderCart([
			{
				id: 'windows-10',
				name: 'Custom Windows 10 ISO',
				price: 65,
				icon: 'fab fa-windows',
				quantity: 1,
			},
		]);

		expect(screen.getByText('Custom Windows 10 ISO')).toBeInTheDocument();
		expect(screen.getAllByText('€65').length).toBeGreaterThanOrEqual(1);

		await user.click(screen.getByRole('button', { name: /increase quantity/i }));

		expect(screen.getByText('€130')).toBeInTheDocument();
	});
});
