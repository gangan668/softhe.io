import evidence from '../../../docs/benchmark-evidence.json';

export { benchmarkPublication } from './benchmarkPublication';

export const benchmarkMethodology = {
  hardware: evidence.hardware,
  operatingSystem: evidence.operatingSystem,
  bios: evidence.bios,
  drivers: evidence.drivers,
  scenario: `${evidence.scenario} ${evidence.warmupProcedure}`,
  graphicsSettings: evidence.graphicsSettings,
  captureDate: evidence.captureDate,
  // validate-benchmark-evidence requires equal run counts for both profiles.
  runCount: evidence.stock.runs.length,
  captureSeconds: evidence.captureSeconds,
  summaryMethod: evidence.summaryMethod,
  gameVersion: evidence.gameVersion,
};

const { stock, optimized } = evidence.reportedMedians;
// Round half away from zero so equal-sized gains and reductions display symmetrically.
export const percentChange = (from, to) => {
  const change = ((to - from) / from) * 100;
  return Math.sign(change) * Math.round(Math.abs(change));
};
const frameTimeMs = (averageFps) => 1000 / averageFps;

export const formatPercentChange = (change) => `${change > 0 ? '+' : ''}${change}%`;

// Display values derived from the published medians so page copy cannot drift from the evidence.
export const benchmarkResults = {
  averageFps: {
    stock: Math.round(stock.averageFps),
    optimized: Math.round(optimized.averageFps),
    change: percentChange(stock.averageFps, optimized.averageFps),
  },
  onePercentLowFps: {
    stock: Math.round(stock.onePercentLowFps),
    optimized: Math.round(optimized.onePercentLowFps),
    change: percentChange(stock.onePercentLowFps, optimized.onePercentLowFps),
  },
  frameTimeMs: {
    stock: frameTimeMs(stock.averageFps).toFixed(2),
    optimized: frameTimeMs(optimized.averageFps).toFixed(2),
    change: percentChange(frameTimeMs(stock.averageFps), frameTimeMs(optimized.averageFps)),
  },
};

// Idle snapshots are separate from the CapFrameX captures and are not in the evidence manifest.
const idle = { processes: { stock: 111, optimized: 31 }, memoryGb: { stock: 2.5, optimized: 0.8 } };
export const idleOverhead = Object.fromEntries(Object.entries(idle).map(([metric, values]) => [
  metric,
  { ...values, change: percentChange(values.stock, values.optimized) },
]));

// Publication does not establish full reproducibility or isolate one product.
export const benchmarkEvidenceComplete = false;
