import { describe, expect, it } from 'vitest';
import evidence from '../../../docs/benchmark-evidence.json';
import { benchmarkMethodology, benchmarkPublication, benchmarkEvidenceComplete, benchmarkResults, formatPercentChange, idleOverhead } from './benchmark';

describe('benchmark publication', () => {
  it('uses the evidence manifest for publication and methodology', () => {
    expect(benchmarkPublication.archiveUrl).toBe(evidence.rawEvidenceArchive.url);
    expect(benchmarkPublication.archiveSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(benchmarkMethodology.runCount).toBe(2);
    expect(benchmarkMethodology.captureSeconds).toBe(109);
    expect(benchmarkMethodology.summaryMethod).toBe('median');
  });
  it('keeps missing-build and multi-variable reproducibility limits visible', () => {
    expect(benchmarkMethodology.gameVersion).toMatch(/exact build identifier was not recorded/i);
    expect(benchmarkMethodology.drivers).toContain('591.86');
    expect(benchmarkMethodology.drivers).toContain('537.58');
    expect(benchmarkEvidenceComplete).toBe(false);
  });
  it('derives the displayed results from the reported medians', () => {
    expect(benchmarkResults.averageFps).toEqual({ stock: 658, optimized: 826, change: 25 });
    expect(benchmarkResults.onePercentLowFps).toEqual({ stock: 225, optimized: 285, change: 27 });
    expect(benchmarkResults.frameTimeMs).toEqual({ stock: '1.52', optimized: '1.21', change: -20 });
    expect(idleOverhead.processes).toEqual({ stock: 111, optimized: 31, change: -72 });
    expect(idleOverhead.memoryGb).toEqual({ stock: 2.5, optimized: 0.8, change: -68 });
    expect(formatPercentChange(25)).toBe('+25%');
    expect(formatPercentChange(-20)).toBe('-20%');
  });
});
