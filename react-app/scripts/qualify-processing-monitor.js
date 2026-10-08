import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';
import process from 'node:process';
import { parseCurlResponse } from './vercel-smoke-request.js';
import { checkReconciliation } from './check-processing-reconciliation.js';

const execute = promisify(execFile);
const team = 'team_N2ebrhHRUamJXfQQ2LXBOEny';
const project = 'prj_ivs19EGdAuvKZJ6nPd34WRtJ3Kki';
const assert = (value) => { if (!value) throw new Error('Processing qualification failed'); };
const results = [];
try {
	const productionSecret = process.env.MONITORING_RECONCILIATION_SECRET;
	const previewSecret = process.env.MONITORING_PREVIEW_RECONCILIATION_SECRET;
	assert(productionSecret?.length >= 32 && previewSecret?.length >= 32 && productionSecret !== previewSecret);
	for (const [name, origin, secret] of [['production', process.env.PROCESSING_CANDIDATE_URL, productionSecret], ['preview', process.env.MONITOR_BASE_URL, previewSecret]]) {
		const url = new URL(origin);
		assert(url.protocol === 'https:' && url.origin === origin && /^softhe-[a-z0-9]+-suportsofthe-9420s-projects\.vercel\.app$/.test(url.hostname));
		const metadataResponse = await fetch(`https://api.vercel.com/v13/deployments/${url.hostname}?teamId=${team}`, { headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` }, signal: AbortSignal.timeout(15000) });
		assert(metadataResponse.ok); const metadata = await metadataResponse.json();
		assert((metadata.projectId || metadata.project?.id) === project && metadata.url === url.hostname && metadata.readyState === 'READY');
		if (name === 'production') assert(metadata.target === 'production' && metadata.meta?.githubCommitSha === process.env.PROCESSING_CANDIDATE_COMMIT);
		else assert(metadata.target !== 'production' && process.env.MONITOR_PREVIEW_BRANCH === 'customer-portal-test' && metadata.meta?.githubCommitRef === process.env.MONITOR_PREVIEW_BRANCH);
		const { stdout } = await execute('npx', ['--yes', 'vercel@59.3.0', 'curl', '/api/health?action=reconcile-processing', '--deployment', origin, '--', '--silent', '--show-error', '--include', '--max-time', '30', '--header', `Authorization: Bearer ${secret}`], { timeout: 60000, maxBuffer: 1048576 });
		const { response, text } = parseCurlResponse(stdout); assert(response.ok); const data = JSON.parse(text);
		checkReconciliation(data);
		results.push({ environment: name, deployment: metadata.id, origin, sourceCommit: metadata.meta?.githubCommitSha, response: data });
	}
	await writeFile('processing-qualification.json', JSON.stringify({ passed: true, verifiedAt: new Date().toISOString(), targets: results }, null, 2) + '\n');
	console.log('Separate Production and isolated Preview reconciliation credentials verified. Scheduling remains disabled.');
} catch {
	console.error('Processing qualification failed. Credentials and command arguments were not logged.');
	process.exitCode = 1;
}
