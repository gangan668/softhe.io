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

		expect(screen.getByRole('dialog', { name: /shopping cart/i })).toHaveAttribute('aria-modal', 'true');
		expect(screen.getByRole('button', { name: /close cart/i })).toHaveFocus();
		expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /browse products/i })).toHaveAttribute('href', '/store');
	});

	it('dismisses with Escape', async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		localStorage.setItem('softhe_cart', '[]');
		render(
			<MemoryRouter>
				<CartProvider>
					<Cart isOpen={true} onClose={onClose} />
				</CartProvider>
			</MemoryRouter>,
		);

		await user.keyboard('{Escape}');
		expect(onClose).toHaveBeenCalledOnce();
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

		await user.click(screen.getByRole('button', { name: /decrease quantity/i }));
		expect(screen.getAllByText('€65').length).toBeGreaterThanOrEqual(1);

		await user.click(screen.getByRole('button', { name: /remove custom windows 10 iso/i }));
		expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
	});

	it('rehydrates trusted product data instead of stored display values', () => {
		renderCart([
			{ id: 'windows-10', name: 'Spoofed product', price: 1, quantity: 99 },
			{ id: 'unknown', name: 'Unknown product', price: 1, quantity: 1 },
		]);

		expect(screen.getByText('Custom Windows 10 ISO')).toBeInTheDocument();
		expect(screen.queryByText('Spoofed product')).not.toBeInTheDocument();
		expect(screen.queryByText('Unknown product')).not.toBeInTheDocument();
		expect(screen.getAllByText('€650').length).toBeGreaterThanOrEqual(1);
	});
});
