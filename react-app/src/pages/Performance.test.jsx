import { describe, it, expect } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
		// Results are drawn from data; the legacy raster screenshots must not return.
		expect(document.querySelector('img')).toBeNull();
	});

	it('charts frame times from the raw captures with a table twin', () => {
		render(
			<MemoryRouter>
				<Performance />
			</MemoryRouter>
		);

		expect(screen.getByRole('heading', { name: /the gap widens in the slowest frames/i })).toBeInTheDocument();
		expect(screen.getByRole('img', { name: /frame-time percentile curves/i })).toBeInTheDocument();
		// The stated gap must agree with the rounded values in the table: 1.27 - 0.99 and 5.02 - 3.86.
		expect(screen.getByText(/grows from 0\.28 ms at the median frame to 1\.16 ms at the 99\.9th percentile/i)).toBeInTheDocument();
		const table = screen.getByRole('table', { name: /median of each profile/i });
		const p1Row = within(table).getByRole('row', { name: /99th percentile \(P1 FPS\)/i });
		// The 1% point reproduces the published P1 FPS medians.
		expect(p1Row).toHaveTextContent('225 FPS');
		expect(p1Row).toHaveTextContent('285 FPS');
	});

	it('reads chart values from the keyboard', async () => {
		const user = userEvent.setup();
		render(
			<MemoryRouter>
				<Performance />
			</MemoryRouter>
		);

		const plot = screen.getByRole('group', { name: /frame-time chart/i });
		act(() => plot.focus());
		const status = within(plot.closest('figure')).getByRole('status');
		expect(status).toHaveTextContent('1 in 100 frames slower');
		await user.keyboard('{End}');
		expect(status).toHaveTextContent('1 in 1,000 frames slower');
		await user.keyboard('{Escape}');
		expect(status).toHaveTextContent('');
	});
});
