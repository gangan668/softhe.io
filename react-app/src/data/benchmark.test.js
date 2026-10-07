import { describe, expect, it } from 'vitest';
import evidence from '../../../docs/benchmark-evidence.json';
import { benchmarkMethodology, benchmarkPublication, benchmarkEvidenceComplete } from './benchmark';

describe('benchmark publication', () => {
  it('uses the evidence manifest for publication and methodology', () => {
    expect(benchmarkPublication.archiveUrl).toBe(evidence.rawEvidenceArchive.url);
    expect(benchmarkPublication.archiveSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(benchmarkMethodology.runCount).toBe(2);
    expect(benchmarkMethodology.summaryMethod).toBe('median');
  });
  it('keeps missing-build and multi-variable reproducibility limits visible', () => {
    expect(benchmarkMethodology.gameVersion).toMatch(/exact build identifier was not recorded/i);
    expect(benchmarkMethodology.software).toContain('591.86');
    expect(benchmarkMethodology.software).toContain('537.58');
    expect(benchmarkEvidenceComplete).toBe(false);
  });
});
