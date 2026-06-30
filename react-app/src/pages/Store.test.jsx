import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../context/CartProvider';
import Store from './Store';

const renderStore = () =>
	render(
		<MemoryRouter>
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
});
