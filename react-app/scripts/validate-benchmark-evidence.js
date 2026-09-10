import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const placeholderPattern = /^(?:pending|todo|tbd|unknown|replace|example|n\/a|none)(?:\b|:)/i;

const meaningful = (value) => typeof value === 'string'
	&& value.trim().length >= 3
	&& !placeholderPattern.test(value.trim());

const median = (values) => {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const validMetric = (value) => Number.isFinite(value) && value > 0;

const validateRuns = (label, runs, errors) => {
	if (!Array.isArray(runs) || runs.length < 2) {
		errors.push(`${label}.runs must contain at least two runs`);
		return null;
	}

	const ids = new Set();
	for (const [index, run] of runs.entries()) {
		const prefix = `${label}.runs[${index}]`;
		if (!meaningful(run?.id)) errors.push(`${prefix}.id is required`);
		else if (ids.has(run.id)) errors.push(`${prefix}.id must be unique`);
		else ids.add(run.id);

		if (!validMetric(run?.averageFps)) errors.push(`${prefix}.averageFps must be a positive number`);
		if (!validMetric(run?.onePercentLowFps)) errors.push(`${prefix}.onePercentLowFps must be a positive number`);
		if (validMetric(run?.averageFps) && validMetric(run?.onePercentLowFps) && run.onePercentLowFps > run.averageFps) {
			errors.push(`${prefix}.onePercentLowFps cannot exceed averageFps`);
		}
		if (!meaningful(run?.rawEvidence)) errors.push(`${prefix}.rawEvidence is required`);
	}

	if (errors.some((error) => error.startsWith(`${label}.runs`))) return null;
	return {
		averageFps: median(runs.map((run) => run.averageFps)),
		onePercentLowFps: median(runs.map((run) => run.onePercentLowFps)),
	};
};

export const validateBenchmarkEvidence = (manifest) => {
	const errors = [];
	if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
		return { errors: ['manifest must be a JSON object'], medians: null };
	}

	if (manifest.schemaVersion !== 1) errors.push('schemaVersion must be 1');
	if (manifest.summaryMethod !== 'median') errors.push('summaryMethod must be median');
	if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.captureDate || '') || Number.isNaN(Date.parse(`${manifest.captureDate}T00:00:00Z`))) {
		errors.push('captureDate must be a valid YYYY-MM-DD date');
	}

	for (const field of ['hardware', 'bios', 'drivers', 'operatingSystem', 'gameVersion', 'graphicsSettings', 'scenario', 'warmupProcedure']) {
		if (!meaningful(manifest[field])) errors.push(`${field} is required and cannot be a placeholder`);
	}

	const stock = validateRuns('stock', manifest.stock?.runs, errors);
	const optimized = validateRuns('optimized', manifest.optimized?.runs, errors);
	const medians = stock && optimized ? { stock, optimized } : null;

	if (medians && manifest.reportedMedians) {
		for (const profile of ['stock', 'optimized']) {
			for (const metric of ['averageFps', 'onePercentLowFps']) {
				if (!Number.isFinite(manifest.reportedMedians[profile]?.[metric])
					|| Math.abs(manifest.reportedMedians[profile][metric] - medians[profile][metric]) > 0.005) {
					errors.push(`reportedMedians.${profile}.${metric} does not match the calculated median`);
				}
			}
		}
	}

	return { errors, medians };
};

const run = async () => {
	const evidencePath = resolve(process.env.BENCHMARK_EVIDENCE_FILE || '../docs/benchmark-evidence.json');
	const manifest = JSON.parse(await readFile(evidencePath, 'utf8'));
	const result = validateBenchmarkEvidence(manifest);
	if (result.errors.length) {
		throw new Error(`Benchmark evidence is incomplete:\n- ${result.errors.join('\n- ')}`);
	}
	console.log(JSON.stringify({ evidencePath, medians: result.medians }, null, 2));
};

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] || '')) {
	await run();
}
