import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CartProvider } from '../context/CartProvider';
import Store from './Store';

vi.mock('../utils/runtimeConfig', () => ({ commerceEnabled: false }));
vi.mock('../utils/checkout', () => ({ verifyCheckoutSession: vi.fn() }));

describe('Store with commerce disabled', () => {
	it('offers one contact path and does not expose cart-building actions', () => {
		render(
			<MemoryRouter initialEntries={['/store']}>
				<CartProvider><Store /></CartProvider>
			</MemoryRouter>,
		);
		expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /buy now/i })).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: /ask about an order/i })).toHaveAttribute('href', '/contact');
		expect(screen.getAllByText(/ordering temporarily unavailable/i)).toHaveLength(3);
	});
});
