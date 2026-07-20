import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Performance from './Performance';

describe('Performance', () => {
	it('renders benchmark proof sections', () => {
		render(
			<MemoryRouter>
				<Performance />
			</MemoryRouter>
		);

		expect(screen.getByRole('heading', { name: /performance proof/i })).toBeInTheDocument();
		expect(screen.getByText(/Counter-Strike 2 FPS comparison/i)).toBeInTheDocument();
		expect(screen.getByText(/Windows Task Manager resource usage/i)).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /benchmark methodology/i })).toBeInTheDocument();
		expect(screen.getByText(/preliminary product evidence/i)).toBeInTheDocument();
	});

	it('keeps task manager screenshots matched to the right labels', () => {
		render(
			<MemoryRouter>
				<Performance />
			</MemoryRouter>
		);

		expect(screen.getByAltText('Stock Windows Task Manager')).toHaveAttribute(
			'src',
			'/images/stock-task-manager.webp'
		);
		expect(screen.getByAltText('Softhe.io Optimized Task Manager')).toHaveAttribute(
			'src',
			'/images/optimized-task-manager.webp'
		);
	});
});
