import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

export const budgets = { js: 120 * 1024, css: 24 * 1024 };
// The portal adds the measured 56 KiB SDK and up to 5 KiB of route code to
// the 80 KiB shared entry. Its explicit limit does not change the public limit.
export const portalBudgets = { js: 140 * 1024, css: 24 * 1024 };
export const sdkBudgets = { js: 60 * 1024, css: 24 * 1024 };

// Static imports and their styles load with their parent. Dynamic imports load
// only when a scenario explicitly requires them.
export function collectAssets(manifest, roots) {
	const visited = new Set();
	const files = new Set();
	function visit(key) {
		if (visited.has(key)) return;
		const chunk = manifest[key];
		if (!chunk) throw new Error(`Missing manifest chunk: ${key}`);
		visited.add(key);
		if (chunk.file) files.add(chunk.file);
		for (const css of chunk.css || []) files.add(css);
		for (const dependency of chunk.imports || []) visit(dependency);
	}
	for (const root of roots) visit(root);
	return [...files];
}

export function measureScenario(manifest, roots, readAsset) {
	return collectAssets(manifest, roots).reduce((totals, file) => {
		const extension = file.endsWith('.js') ? 'js' : file.endsWith('.css') ? 'css' : null;
		if (extension) totals[extension] += gzipSync(readAsset(file)).byteLength;
		totals.files.push(file);
		return totals;
	}, { js: 0, css: 0, files: [] });
}

export function assertBudget(name, totals, limits = budgets) {
	for (const extension of ['js', 'css']) {
		if (totals[extension] > limits[extension]) {
			throw new Error(`${name} ${extension.toUpperCase()} is ${totals[extension]} gzipped bytes; budget is ${limits[extension]}.`);
		}
	}
}

function run() {
	const directory = resolve(process.argv[2] || join(process.cwd(), 'dist'));
	const manifest = JSON.parse(readFileSync(join(directory, '.vite/manifest.json'), 'utf8'));
	const entries = Object.keys(manifest).filter((key) => manifest[key].isEntry);
	if (!entries.length) throw new Error('Build manifest has no entry point.');
	const sdk = Object.keys(manifest).filter((key) => /supabase-js.*index\.mjs$/.test(key));
	const analytics = 'src/components/VercelAnalyticsClient.jsx';
	if (!manifest[analytics]) throw new Error('Missing consented analytics manifest entry.');
	if (sdk.length !== 1) throw new Error('Expected one authentication SDK manifest entry.');
	const publicChunks = Object.keys(manifest).filter((key) => key.startsWith('src/pages/') && !/\/(Home|AuthPage|ResetPassword|Account|Admin|Checkout)\.jsx$/.test(key));
	// Matches the fixed public route allowlist in publicAnalyticsPath. Unknown
	// paths and direct private-route startup do not load the analytics client.
	const analyticsPages = new Set(['Services', 'Store', 'Performance', 'Contact', 'FAQ', 'PrivacyPolicy', 'CookiePolicy', 'Terms', 'LegalNotice', 'Withdrawal']);
	const pageName = (key) => key.split('/').pop().replace('.jsx', '');
	const home = 'src/pages/Home.jsx';
	if (!manifest[home]) throw new Error('Missing homepage manifest entry.');
	const scenarios = [
		{ name: 'anonymous-home', roots: [...entries, home], limits: budgets },
		{ name: 'consented-anonymous-home', roots: [...entries, home, analytics], limits: budgets },
		...publicChunks.map((key) => ({
			name: `anonymous-${pageName(key).toLowerCase()}`,
			roots: [...entries, key], limits: budgets,
		})),
		...publicChunks.filter((key) => analyticsPages.has(pageName(key))).map((key) => ({
			name: `consented-anonymous-${pageName(key).toLowerCase()}`,
			roots: [...entries, analytics, key], limits: budgets,
		})),
		{ name: 'authentication-sdk', roots: sdk, limits: sdkBudgets },
		{ name: 'consented-authenticated-home', roots: [...entries, home, ...sdk, analytics], limits: portalBudgets },
		...publicChunks.map((key) => ({
			name: `${analyticsPages.has(pageName(key)) ? 'consented-' : ''}authenticated-${pageName(key).toLowerCase()}`,
			roots: [...entries, ...sdk, ...(analyticsPages.has(pageName(key)) ? [analytics] : []), key], limits: portalBudgets,
		})),
		...['AuthPage', 'ResetPassword', 'Account', 'Admin', 'Checkout'].map((page) => ({
			name: `portal-${page.toLowerCase()}`,
			roots: [...entries, ...sdk, `src/pages/${page}.jsx`],
			limits: portalBudgets,
		})),
	];
	for (const { name, roots, limits } of scenarios) {
		const totals = measureScenario(manifest, roots, (file) => readFileSync(join(directory, file)));
		console.log(JSON.stringify({ scenario: name, ...totals, budgets: limits }));
		assertBudget(name, totals, limits);
	}
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] || '')) run();
