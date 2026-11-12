const PENDING = {
	hardware: 'Hardware details pending publication',
	software: 'BIOS, driver, and Windows versions pending publication',
	scenario: 'Game settings and test procedure pending publication',
	captureDate: 'Capture date pending publication',
	summaryMethod: 'Method pending publication',
};

const parseRunCount = (value) => {
	const runCount = Number.parseInt(value || '', 10);
	return Number.isFinite(runCount) ? runCount : null;
};

/**
 * Builds the benchmark methodology from VITE_BENCHMARK_* values and reports
 * which pieces of evidence are still unpublished. Never invents values: any
 * unset field keeps a "pending publication" placeholder and is listed in `missing`.
 */
export function buildBenchmarkEvidence(env = {}) {
	const runCount = parseRunCount(env.VITE_BENCHMARK_RUN_COUNT);
	const summaryMethod = env.VITE_BENCHMARK_SUMMARY_METHOD || '';

	const methodology = {
		hardware: env.VITE_BENCHMARK_HARDWARE || PENDING.hardware,
		software: env.VITE_BENCHMARK_SOFTWARE || PENDING.software,
		scenario: env.VITE_BENCHMARK_SCENARIO || PENDING.scenario,
		captureDate: env.VITE_BENCHMARK_CAPTURE_DATE || PENDING.captureDate,
		runCount,
		summaryMethod: summaryMethod || PENDING.summaryMethod,
	};

	const checks = [
		{ key: 'hardware', label: 'Test hardware (CPU, GPU, motherboard, memory)', published: Boolean(env.VITE_BENCHMARK_HARDWARE) },
		{ key: 'software', label: 'BIOS, driver, and Windows versions', published: Boolean(env.VITE_BENCHMARK_SOFTWARE) },
		{ key: 'scenario', label: 'Game settings and test procedure', published: Boolean(env.VITE_BENCHMARK_SCENARIO) },
		{ key: 'captureDate', label: 'Capture date', published: Boolean(env.VITE_BENCHMARK_CAPTURE_DATE) },
		{ key: 'runCount', label: 'Number of repeated runs (at least two per configuration)', published: runCount !== null && runCount >= 2 },
		{ key: 'summaryMethod', label: 'Summary method (median of repeated runs)', published: summaryMethod.toLowerCase() === 'median' },
	];

	const missing = checks.filter((check) => !check.published).map(({ key, label }) => ({ key, label }));

	return {
		methodology,
		complete: missing.length === 0,
		missing,
		published: checks.filter((check) => check.published).map(({ key }) => key),
	};
}

const evidence = buildBenchmarkEvidence(import.meta.env);

export const benchmarkMethodology = evidence.methodology;
export const benchmarkEvidenceComplete = evidence.complete;
export const missingBenchmarkEvidence = evidence.missing;
export const publishedBenchmarkFields = evidence.published;
