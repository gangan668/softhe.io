import evidence from '../../../docs/benchmark-evidence.json';

export { benchmarkPublication } from './benchmarkPublication';

export const benchmarkMethodology = {
  hardware: evidence.hardware,
  software: `${evidence.operatingSystem} ${evidence.bios} ${evidence.drivers}`,
  scenario: `${evidence.scenario} ${evidence.graphicsSettings} ${evidence.warmupProcedure}`,
  captureDate: evidence.captureDate,
  runCount: Math.min(evidence.stock.runs.length, evidence.optimized.runs.length),
  summaryMethod: evidence.summaryMethod,
  gameVersion: evidence.gameVersion,
};

// Publication does not establish full reproducibility or isolate one product.
export const benchmarkEvidenceComplete = false;
