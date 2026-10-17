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

const { stock, optimized } = evidence.reportedMedians;
const percentChange = (from, to) => Math.round(((to - from) / from) * 100);
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

// Publication does not establish full reproducibility or isolate one product.
export const benchmarkEvidenceComplete = false;
