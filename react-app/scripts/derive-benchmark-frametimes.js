#!/usr/bin/env node

/**
 * Derive the frame-time percentile curves shown on /performance from the published raw captures.
 *
 * Usage (from react-app): npm run benchmark:frametimes -- <raw-evidence.zip, or a directory containing it>
 * The archive is the one named in docs/benchmark-evidence.json. Its SHA-256 must match the manifest,
 * and the captures are read from those verified bytes (with per-entry CRC checks), never from an
 * extracted copy that could differ. The output is small enough to commit, so builds never download
 * the 8 MB archive.
 */

import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import process from 'node:process';
import { readZipEntries } from './read-zip.js';

const input = resolve(process.argv[2] || '../docs/audits/2026-10-07/benchmark');
const archivePath = statSync(input).isDirectory() ? join(input, 'raw-evidence.zip') : input;
const manifestPath = new URL('../../docs/benchmark-evidence.json', import.meta.url);
const outputPath = new URL('../../docs/benchmark-frametimes.json', import.meta.url);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const archive = readFileSync(archivePath);
const sha256 = createHash('sha256').update(archive).digest('hex');
if (sha256 !== manifest.rawEvidenceArchive.sha256) throw new Error('Archive checksum does not match docs/benchmark-evidence.json');

// Share of frames slower than the plotted frame time, from the median (0.5) to one frame in a
// thousand (0.001). Log-spaced so the tail, where stutter lives, gets most of the resolution.
const steps = 48;
const exceedance = [...new Set([
	...Array.from({ length: steps + 1 }, (_, index) => 0.5 * (0.001 / 0.5) ** (index / steps)),
	0.1, 0.01,
].map((value) => Number(value.toPrecision(6))))].sort((a, b) => b - a);

const runs = [...manifest.stock.runs.map((run) => ({ ...run, profile: 'stock' })), ...manifest.optimized.runs.map((run) => ({ ...run, profile: 'optimized' }))];
// Keyed by file name; the archive may nest entries in a folder.
const captures = new Map([...readZipEntries(archive)]
	.filter(([name]) => basename(name).startsWith('CapFrameX-') && name.endsWith('.json'))
	.map(([name, contents]) => [basename(name), contents]));
const names = [...captures.keys()];
if (names.length !== runs.length) throw new Error(`Expected ${runs.length} captures, found ${names.length}`);

const derived = runs.map((run) => {
	const name = names.find((candidate) => run.rawEvidence.startsWith(`${candidate};`));
	if (!name) throw new Error(`No capture for ${run.id}`);
	// CapFrameX writes a byte-order mark, which trimStart removes along with other leading whitespace.
	const capture = JSON.parse(captures.get(name).toString('utf8').trimStart());
	if (!run.rawEvidence.includes(capture.Hash)) throw new Error(`Capture hash mismatch for ${run.id}`);
	const frames = capture.Runs[0].CaptureData.MsBetweenPresents;
	if (!frames.length || frames.some((value) => !Number.isFinite(value) || value <= 0)) throw new Error(`Invalid frame times in ${name}`);
	const slowestFirst = [...frames].sort((a, b) => b - a);
	// Same percentile definition as verify-raw-benchmark.js, so exceedance 0.01 reproduces P1 FPS.
	const at = (share) => slowestFirst[Math.floor(frames.length * share)];
	return {
		id: run.id,
		profile: run.profile,
		frames: frames.length,
		frameTimeMs: exceedance.map((share) => Number(at(share).toFixed(5))),
	};
});

const output = {
	schemaVersion: 1,
	source: { archiveUrl: manifest.rawEvidenceArchive.url, archiveSha256: sha256 },
	definition: 'frameTimeMs[i] is the frame time that exceedance[i] of frames in the run were slower than: the slowest-first frame at index floor(frames x exceedance). Exceedance 0.01 is the P1 FPS frame time.',
	exceedance,
	runs: derived,
};
writeFileSync(outputPath, `${JSON.stringify(output, null, '\t')}\n`);
console.log(`Wrote ${derived.length} runs x ${exceedance.length} percentiles to docs/benchmark-frametimes.json`);
