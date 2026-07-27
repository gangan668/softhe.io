import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ALLOWED_ADVISORY = 'https://github.com/advisories/GHSA-qwww-vcr4-c8h2';
const PINNED_ROUTER_VERSION = '7.18.1';

export const validateAuditReport = (report, installedRouterVersion) => {
	if (installedRouterVersion !== PINNED_ROUTER_VERSION) {
		throw new Error(
			`React Router audit exception requires react-router-dom ${PINNED_ROUTER_VERSION}; found ${installedRouterVersion || 'unknown'}`,
		);
	}

	const vulnerabilities = report?.vulnerabilities;
	if (!vulnerabilities || typeof vulnerabilities !== 'object') {
		throw new Error('npm audit did not return a vulnerability map');
	}

	const names = Object.keys(vulnerabilities).sort();
	if (names.join(',') !== 'react-router,react-router-dom') {
		throw new Error(`Unexpected audit findings: ${names.join(', ') || 'none'}`);
	}

	const router = vulnerabilities['react-router'];
	const routerDom = vulnerabilities['react-router-dom'];
	const routerAdvisories = Array.isArray(router?.via)
		? router.via.filter((entry) => typeof entry === 'object')
		: [];
	const routerLinks = routerAdvisories.map((entry) => entry.url);
	if (
		router?.severity !== 'high'
		|| routerLinks.length !== 1
		|| routerLinks[0] !== ALLOWED_ADVISORY
	) {
		throw new Error(`React Router findings do not match the approved exception: ${routerLinks.join(', ')}`);
	}

	if (
		routerDom?.severity !== 'high'
		|| !Array.isArray(routerDom.via)
		|| routerDom.via.length !== 1
		|| routerDom.via[0] !== 'react-router'
	) {
		throw new Error('react-router-dom finding does not resolve exclusively to the approved React Router advisory');
	}

	const counts = report?.metadata?.vulnerabilities;
	if (counts?.high !== 2 || counts?.critical !== 0 || counts?.total !== 2) {
		throw new Error(`Unexpected audit totals: ${JSON.stringify(counts || {})}`);
	}

	return {
		advisory: ALLOWED_ADVISORY,
		version: PINNED_ROUTER_VERSION,
	};
};

const run = () => {
	const npmCli = process.env.npm_execpath;
	if (!npmCli) throw new Error('Run this policy through npm so npm_execpath is available');

	const result = spawnSync(process.execPath, [npmCli, 'audit', '--audit-level=high', '--json'], {
		encoding: 'utf8',
	});
	if (result.error) throw result.error;

	let report;
	try {
		report = JSON.parse(result.stdout);
	} catch {
		throw new Error(`npm audit returned invalid JSON: ${result.stderr || result.stdout}`);
	}

	const packageManifest = JSON.parse(
		readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
	);
	const installedRouterVersion = packageManifest.dependencies?.['react-router-dom'];
	const accepted = validateAuditReport(report, installedRouterVersion);
	console.warn(
		`Audit passed with approved exception ${accepted.advisory} for react-router-dom ${accepted.version}; this SPA does not use React Server Components or server actions.`,
	);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	try {
		run();
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
