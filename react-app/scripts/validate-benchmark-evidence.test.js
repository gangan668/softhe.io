import { describe, expect, it } from 'vitest';
import { validateBenchmarkEvidence } from './validate-benchmark-evidence';

const validManifest = {
	schemaVersion: 1,
	captureDate: '2026-07-27',
	summaryMethod: 'median',
	hardware: 'AMD Ryzen 7 7800X3D; RTX 4080; 32 GB DDR5-6000',
	bios: 'Vendor 1.2.3; EXPO enabled',
	drivers: 'NVIDIA 600.00; chipset 8.0',
	operatingSystem: 'Windows 11 24H2 build 26100',
	gameVersion: 'Counter-Strike 2 build 12345',
	graphicsSettings: '1920x1080; low preset; V-Sync off',
	scenario: 'Workshop benchmark, identical route and duration',
	warmupProcedure: 'One unrecorded warm-up run before each profile',
	stock: {
		runs: [
			{ id: 'stock-1', averageFps: 650, onePercentLowFps: 330, rawEvidence: 'raw/stock-1.png' },
			{ id: 'stock-2', averageFps: 670, onePercentLowFps: 350, rawEvidence: 'raw/stock-2.png' },
			{ id: 'stock-3', averageFps: 660, onePercentLowFps: 340, rawEvidence: 'raw/stock-3.png' },
		],
	},
	optimized: {
		runs: [
			{ id: 'optimized-1', averageFps: 910, onePercentLowFps: 480, rawEvidence: 'raw/optimized-1.png' },
			{ id: 'optimized-2', averageFps: 930, onePercentLowFps: 500, rawEvidence: 'raw/optimized-2.png' },
			{ id: 'optimized-3', averageFps: 920, onePercentLowFps: 490, rawEvidence: 'raw/optimized-3.png' },
		],
	},
	reportedMedians: {
		stock: { averageFps: 660, onePercentLowFps: 340 },
		optimized: { averageFps: 920, onePercentLowFps: 490 },
	},
};

describe('benchmark evidence validation', () => {
	it('calculates and verifies medians from three runs per profile', () => {
		const result = validateBenchmarkEvidence(validManifest);
		expect(result.errors).toEqual([]);
		expect(result.medians).toEqual(validManifest.reportedMedians);
	});

	it('rejects fewer than three runs', () => {
		const manifest = structuredClone(validManifest);
		manifest.stock.runs.pop();
		expect(validateBenchmarkEvidence(manifest).errors).toContain('stock.runs must contain at least three runs');
	});

	it('rejects placeholders and missing raw evidence', () => {
		const manifest = structuredClone(validManifest);
		manifest.hardware = 'Pending';
		manifest.optimized.runs[0].rawEvidence = '';
		const { errors } = validateBenchmarkEvidence(manifest);
		expect(errors).toContain('hardware is required and cannot be a placeholder');
		expect(errors).toContain('optimized.runs[0].rawEvidence is required');
	});

	it('rejects reported values that differ from calculated medians', () => {
		const manifest = structuredClone(validManifest);
		manifest.reportedMedians.stock.averageFps = 999;
		expect(validateBenchmarkEvidence(manifest).errors).toContain(
			'reportedMedians.stock.averageFps does not match the calculated median',
		);
	});
});
