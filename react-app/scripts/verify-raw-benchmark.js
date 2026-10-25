import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import process from 'node:process';
import { validateBenchmarkEvidence } from './validate-benchmark-evidence.js';

const directory = resolve(process.argv[2] || '../docs/audits/2026-10-07/benchmark');
const manifest = JSON.parse(readFileSync('../docs/benchmark-evidence.json', 'utf8'));
const sha256 = createHash('sha256').update(readFileSync(join(directory, 'raw-evidence.zip'))).digest('hex');
if (sha256 !== manifest.rawEvidenceArchive.sha256) throw new Error('Archive checksum mismatch');
const captures = join(directory, 'captures');
const names = readdirSync(captures).filter((name) => name.startsWith('CapFrameX-') && name.endsWith('.json'));
const manifestRuns = [...manifest.stock.runs, ...manifest.optimized.runs];
if (names.length !== manifestRuns.length) throw new Error(`Expected ${manifestRuns.length} raw captures, found ${names.length}`);
const embedded = JSON.parse(readFileSync(join(captures, 'benchmark-evidence.json'), 'utf8'));
if (JSON.stringify(embedded.reportedMedians) !== JSON.stringify(manifest.reportedMedians)) throw new Error('Embedded median mismatch');
const results = names.map((name) => {
	const capture = JSON.parse(readFileSync(join(captures, name), 'utf8').replace(/^\uFEFF/, ''));
	if (capture.Runs.length !== 1) throw new Error(`Unexpected run count in ${name}`);
	const frames = capture.Runs[0].CaptureData.MsBetweenPresents;
	if (!frames.length || frames.some((value) => !Number.isFinite(value) || value <= 0)) throw new Error(`Invalid frame times in ${name}`);
	const total = frames.reduce((sum, value) => sum + value, 0);
	const slowestFirst = [...frames].sort((a, b) => b - a);
	const averageFps = 1000 * frames.length / total;
	// The manifest's onePercentLowFps field holds P1 FPS: the 99th percentile
	// frame time converted to FPS, not the mean of the slowest one percent of frames.
	const onePercentLowFps = 1000 / slowestFirst[Math.floor(frames.length * 0.01)];
	const expected = manifestRuns.find((run) => run.rawEvidence.startsWith(`${name};`));
	// The hash is read from the capture itself, so this only ties each file to its manifest entry;
	// the archive checksum above is what detects edited frame data.
	if (!expected || !expected.rawEvidence.includes(capture.Hash)) throw new Error(`Unrecognized capture ${name}`);
	for (const [metric, actual] of Object.entries({ averageFps, onePercentLowFps })) {
		if (Math.abs(expected[metric] - actual) > 0.005) throw new Error(`${name} ${metric} mismatch`);
	}
	return { name, captureHash: capture.Hash, frames: frames.length, seconds: total / 1000, averageFps, onePercentLowFps };
});
// Every run must match the published capture duration, so uneven sample lengths cannot skew the medians.
for (const { name, seconds } of results) {
	if (Math.abs(seconds - manifest.captureSeconds) > 1) throw new Error(`${name} lasted ${seconds} s; manifest states ${manifest.captureSeconds} s`);
}
const validation = validateBenchmarkEvidence(manifest);
if (validation.errors.length) throw new Error(validation.errors.join('\n'));
const result = { archiveUrl: manifest.rawEvidenceArchive.url, sha256, archiveBytes: readFileSync(join(directory, 'raw-evidence.zip')).length, captures: results, medians: validation.medians, limitations: ['Capture authenticity and original test execution were not independently observed.', 'The exact CS2 build and chipset-driver versions were not recorded.', 'Windows edition, memory settings, BIOS profile and GPU driver changed.', 'The reported P1 FPS is a frame-time percentile, not the mean of the slowest one percent.'] };
writeFileSync(join(directory, 'verification.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
