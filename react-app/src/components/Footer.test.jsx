import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Footer from './Footer';

describe('Footer brand icons', () => {
	it('renders real SVG icons for every social brand', () => {
		render(
			<MemoryRouter>
				<Footer />
			</MemoryRouter>,
		);

		for (const label of ['X (formerly Twitter)', 'Discord', 'GitHub', 'YouTube']) {
			const link = screen.getByRole('link', { name: label });
			expect(link.querySelector('svg.brand-icon path')).toBeInTheDocument();
		}

		const contactLink = screen.getByRole('link', { name: '@softhecs' });
		expect(contactLink.closest('li')?.querySelector('svg.brand-icon path')).toBeInTheDocument();
	});
});
