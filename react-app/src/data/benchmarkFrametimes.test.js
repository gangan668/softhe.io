import { describe, expect, it } from 'vitest';
import evidence from '../../../docs/benchmark-evidence.json';
import frametimes from '../../../docs/benchmark-frametimes.json';
import { percentileRows, profileFrameTime } from './benchmarkFrametimes';

const manifestRuns = [...evidence.stock.runs.map((run) => ({ ...run, profile: 'stock' })), ...evidence.optimized.runs.map((run) => ({ ...run, profile: 'optimized' }))];

describe('derived frame-time curves', () => {
	it('come from the archive the evidence manifest publishes', () => {
		expect(frametimes.source.archiveSha256).toBe(evidence.rawEvidenceArchive.sha256);
		expect(frametimes.source.archiveUrl).toBe(evidence.rawEvidenceArchive.url);
	});

	it('cover exactly the manifest runs with their profiles', () => {
		expect(frametimes.runs.map(({ id, profile }) => ({ id, profile }))).toEqual(manifestRuns.map(({ id, profile }) => ({ id, profile })));
	});

	it('reproduce each published P1 FPS at the 1% point', () => {
		const index = frametimes.exceedance.indexOf(0.01);
		for (const run of frametimes.runs) {
			const published = manifestRuns.find((entry) => entry.id === run.id).onePercentLowFps;
			expect(Math.abs(1000 / run.frameTimeMs[index] - published), run.id).toBeLessThan(0.01);
		}
	});

	it('only get slower toward the tail, as percentiles must', () => {
		for (const run of frametimes.runs) {
			run.frameTimeMs.slice(1).forEach((value, index) => expect(value).toBeGreaterThanOrEqual(run.frameTimeMs[index]));
		}
	});

	it('summarize each profile by the median of its runs', () => {
		const p1 = percentileRows.find((row) => row.share === 0.01);
		expect(1000 / p1.values.stock).toBeCloseTo(evidence.reportedMedians.stock.onePercentLowFps, 2);
		expect(1000 / p1.values.optimized).toBeCloseTo(evidence.reportedMedians.optimized.onePercentLowFps, 2);
		expect(profileFrameTime('stock', 0)).toBeGreaterThan(0);
	});
});
