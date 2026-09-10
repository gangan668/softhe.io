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
		expect(screen.getByRole('heading', { name: /less work before the game starts/i })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /the improvement is the process/i })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /benchmark methodology/i })).toBeInTheDocument();
		expect(screen.getByText(/preliminary product evidence/i)).toBeInTheDocument();
	});

	it('renders benchmark and overhead metrics natively without legacy screenshots', () => {
		render(
			<MemoryRouter>
				<Performance />
			</MemoryRouter>
		);

		expect(screen.getByText('Before · Default Windows')).toBeInTheDocument();
		expect(screen.getByText('After · SoftheOS + BIOS')).toBeInTheDocument();
		expect(screen.getByText('2 × 109 seconds')).toBeInTheDocument();
		expect(screen.getByText(/version 74 represents repeated rounds/i)).toBeInTheDocument();
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});
});
