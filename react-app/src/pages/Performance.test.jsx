import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { buildBenchmarkEvidence } from '../data/benchmark';
import Performance from './Performance';

const COMPLETE_ENV = {
	VITE_BENCHMARK_HARDWARE: 'Test CPU, test GPU',
	VITE_BENCHMARK_SOFTWARE: 'Test BIOS, test driver',
	VITE_BENCHMARK_SCENARIO: 'Test scenario',
	VITE_BENCHMARK_CAPTURE_DATE: '2026-01-01',
	VITE_BENCHMARK_RUN_COUNT: '3',
	VITE_BENCHMARK_SUMMARY_METHOD: 'median',
};

const evidenceState = vi.hoisted(() => ({ env: {} }));

vi.mock('../data/benchmark', async (importOriginal) => {
	const actual = await importOriginal();
	const current = () => actual.buildBenchmarkEvidence(evidenceState.env);
	return {
		...actual,
		get benchmarkMethodology() { return current().methodology; },
		get benchmarkEvidenceComplete() { return current().complete; },
		get missingBenchmarkEvidence() { return current().missing; },
		get publishedBenchmarkFields() { return current().published; },
	};
});

const renderPerformance = () => render(
	<MemoryRouter>
		<Performance />
	</MemoryRouter>,
);

describe('buildBenchmarkEvidence', () => {
	it('reports every field as missing when no evidence is configured', () => {
		const evidence = buildBenchmarkEvidence({});
		expect(evidence.complete).toBe(false);
		expect(evidence.missing.map((item) => item.key)).toEqual([
			'hardware', 'software', 'scenario', 'captureDate', 'runCount', 'summaryMethod',
		]);
		expect(evidence.methodology.hardware).toMatch(/pending publication/i);
		expect(evidence.methodology.runCount).toBeNull();
	});

	it('is complete only with every field, at least two runs, and a median summary', () => {
		expect(buildBenchmarkEvidence(COMPLETE_ENV).complete).toBe(true);
		expect(buildBenchmarkEvidence({ ...COMPLETE_ENV, VITE_BENCHMARK_RUN_COUNT: '1' }).missing.map((item) => item.key)).toEqual(['runCount']);
		expect(buildBenchmarkEvidence({ ...COMPLETE_ENV, VITE_BENCHMARK_SUMMARY_METHOD: 'mean' }).complete).toBe(false);
	});
});

describe('Performance', () => {
	beforeEach(() => {
		evidenceState.env = {};
	});

	it('renders benchmark proof sections', () => {
		renderPerformance();

		expect(screen.getByText(/Counter-Strike 2 FPS comparison/i)).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /idle process and memory use/i })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /version 74 follows repeated testing and revision/i })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /benchmark methodology/i })).toBeInTheDocument();
		expect(screen.getByText(/figures cannot establish the effect of a single product/i)).toBeInTheDocument();
	});

	it('renders benchmark and overhead metrics natively without legacy screenshots', () => {
		renderPerformance();

		expect(screen.getByText('Before · Default Windows')).toBeInTheDocument();
		expect(screen.getByText('After · SoftheOS + BIOS')).toBeInTheDocument();
		expect(screen.getByText('2 × 109 seconds')).toBeInTheDocument();
		expect(screen.getByText(/build has been revised over many releases/i)).toBeInTheDocument();
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});

	it('tones down the headline and lists unpublished evidence when methodology is incomplete', () => {
		renderPerformance();

		expect(screen.getByRole('heading', { level: 1, name: /early results from one test pc/i })).toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: /measured results from the current test pc/i })).not.toBeInTheDocument();
		expect(screen.getByText('Preliminary benchmark sample')).toBeInTheDocument();
		expect(screen.queryByText(/pending publication/i)).not.toBeInTheDocument();
		expect(document.querySelector('.methodology-grid')).toBeNull();

		const notice = screen.getByRole('note', { name: /evidence not yet published/i });
		const items = within(notice).getAllByRole('listitem').map((item) => item.textContent);
		expect(items).toEqual(expect.arrayContaining([
			expect.stringMatching(/test hardware/i),
			expect.stringMatching(/capture date/i),
			expect.stringMatching(/raw run captures/i),
		]));
		expect(items).toHaveLength(7);
	});

	it('shows only published values alongside the notice when evidence is partial', () => {
		evidenceState.env = { VITE_BENCHMARK_HARDWARE: 'Test CPU, test GPU' };
		renderPerformance();

		const notice = screen.getByRole('note', { name: /evidence not yet published/i });
		expect(within(notice).getByText('Test CPU, test GPU')).toBeInTheDocument();
		expect(within(notice).queryByText(/test hardware/i)).not.toBeInTheDocument();
		expect(within(notice).getAllByRole('listitem')).toHaveLength(6);
	});

	it('shows the full methodology grid and measured headline when evidence is complete', () => {
		evidenceState.env = COMPLETE_ENV;
		renderPerformance();

		expect(screen.getByRole('heading', { level: 1, name: /measured results from the current test pc/i })).toBeInTheDocument();
		expect(screen.queryByRole('note', { name: /evidence not yet published/i })).not.toBeInTheDocument();
		const grid = document.querySelector('.methodology-grid');
		expect(grid).not.toBeNull();
		expect(within(grid).getAllByRole('term').map((term) => term.textContent)).toEqual([
			'Hardware', 'Software', 'Scenario', 'Captured', 'Repeated runs', 'Summary',
		]);
		expect(within(grid).getByText('Test scenario')).toBeInTheDocument();
		expect(within(grid).getByText('3')).toBeInTheDocument();
	});
});
