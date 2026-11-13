import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { benchmarkResults } from '../data/benchmark';
import { PRODUCTS } from '../data/products';
import Home from './Home';

const renderHome = () => render(
	<MemoryRouter>
		<Home />
	</MemoryRouter>
);

const lowestPrice = Math.min(...PRODUCTS.map((product) => product.price));

describe('Home', () => {
	it('shows the benchmark result once, in the hero panel with its caveat and a details link', () => {
		const { container } = renderHome();
		const panel = screen.getByRole('group', { name: /performance comparison preview/i });
		const { stock, optimized } = benchmarkResults.averageFps;

		expect(within(panel).getByText(String(stock))).toBeInTheDocument();
		expect(within(panel).getByText(String(optimized))).toBeInTheDocument();
		expect(within(panel).getByText(/cannot isolate the effect of one product/i)).toBeInTheDocument();
		expect(within(panel).getByRole('link', { name: /read the benchmark details/i })).toHaveAttribute('href', '/performance');

		// The headline figures must not be repeated elsewhere on the page.
		const outsidePanel = container.textContent.replace(panel.textContent, '');
		expect(outsidePanel).not.toContain(String(stock));
		expect(outsidePanel).not.toContain(String(optimized));
		expect(container.querySelector('.performance-preview')).toBeNull();
		expect(screen.getAllByRole('link', { name: /read the benchmark details/i })).toHaveLength(1);
	});

	it('uses the proof strip for ordering facts instead of benchmark numbers', () => {
		renderHome();
		const strip = screen.getByRole('region', { name: /what you can order/i });

		expect(within(strip).getByText(`${PRODUCTS.length} products`)).toBeInTheDocument();
		expect(within(strip).getByText(`From €${lowestPrice}`)).toBeInTheDocument();
		expect(within(strip).getByText('Up to 10% off')).toBeInTheDocument();
		expect(within(strip).getByText('14 days')).toBeInTheDocument();
		expect(within(strip).queryByText(/fps|frame time|idle processes/i)).toBeNull();
		expect(screen.queryByRole('region', { name: /preliminary test summary/i })).toBeNull();
	});

	it('keeps the order information and licence requirement', () => {
		renderHome();

		expect(screen.getByRole('heading', { level: 1, name: /cut windows overhead/i })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /withdrawal rights/i })).toBeInTheDocument();
		expect(screen.getByText(/you must supply a valid windows licence/i)).toBeInTheDocument();
	});
});
