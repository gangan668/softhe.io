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

		expect(screen.getByRole('heading', { name: /measured results from the current test pc/i })).toBeInTheDocument();
		expect(screen.getByText(/Counter-Strike 2 FPS comparison/i)).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /idle process and memory use/i })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /version 74 follows repeated testing and revision/i })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /benchmark methodology/i })).toBeInTheDocument();
		expect(screen.getByText(/figures cannot establish the effect of a single product/i)).toBeInTheDocument();
		expect(screen.getByText(/exact build identifier was not recorded/i)).toBeInTheDocument();
		expect(screen.getAllByRole('link', { name: /download the four raw CapFrameX captures/i })[0]).toHaveAttribute('href', expect.stringContaining('benchmark-evidence-v74-2026-08-13'));
		expect(screen.queryByText(/raw runs are not yet published/i)).not.toBeInTheDocument();
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
		expect(screen.getByText(/build has been revised over many releases/i)).toBeInTheDocument();
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});
});
