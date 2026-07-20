const readEnv = (name, fallback) => import.meta.env[name] || fallback;

const parseRunCount = () => {
	const runCount = Number.parseInt(import.meta.env.VITE_BENCHMARK_RUN_COUNT || '', 10);
	return Number.isFinite(runCount) ? runCount : null;
};

export const benchmarkMethodology = {
	hardware: readEnv('VITE_BENCHMARK_HARDWARE', 'Hardware details pending publication'),
	software: readEnv('VITE_BENCHMARK_SOFTWARE', 'BIOS, driver, and Windows versions pending publication'),
	scenario: readEnv('VITE_BENCHMARK_SCENARIO', 'Game settings and test procedure pending publication'),
	captureDate: readEnv('VITE_BENCHMARK_CAPTURE_DATE', 'Capture date pending publication'),
	runCount: parseRunCount(),
	summaryMethod: readEnv('VITE_BENCHMARK_SUMMARY_METHOD', 'Method pending publication'),
};

export const benchmarkEvidenceComplete = Boolean(
	import.meta.env.VITE_BENCHMARK_HARDWARE
		&& import.meta.env.VITE_BENCHMARK_SOFTWARE
		&& import.meta.env.VITE_BENCHMARK_SCENARIO
		&& import.meta.env.VITE_BENCHMARK_CAPTURE_DATE
		&& benchmarkMethodology.runCount >= 3
		&& benchmarkMethodology.summaryMethod.toLowerCase() === 'median',
);
