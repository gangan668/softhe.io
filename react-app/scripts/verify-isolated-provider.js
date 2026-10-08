import { execFile } from 'node:child_process';
import process from 'node:process';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';
import { parseCurlResponse } from './vercel-smoke-request.js';

const execute = promisify(execFile);
const projectId = 'prj_ivs19EGdAuvKZJ6nPd34WRtJ3Kki';
const teamId = 'team_N2ebrhHRUamJXfQQ2LXBOEny';
const fail = () => { throw new Error('Isolated provider verification refused or failed; inspect the sanitized report.'); };

try {
	const origin = process.env.PROVIDER_DEPLOYMENT_URL;
	const commit = process.env.PROVIDER_SOURCE_COMMIT;
	const secret = process.env.MONITORING_TEST_SECRET;
	const url = new URL(origin);
	if (url.protocol !== 'https:' || !url.hostname.endsWith('.vercel.app') || url.origin !== origin || !/^[a-f0-9]{40}$/.test(commit || '') || secret?.length < 32 || !secret || !process.env.VERCEL_TOKEN || process.env.PROVIDER_ACKNOWLEDGE_TEMPORARY_USERS !== 'true') fail();
	const metadataResponse = await fetch(`https://api.vercel.com/v13/deployments/${encodeURIComponent(url.hostname)}?teamId=${teamId}`, { headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` }, signal: AbortSignal.timeout(15000) });
	if (!metadataResponse.ok) fail();
	const metadata = await metadataResponse.json();
	if (metadata.url !== url.hostname || metadata.projectId !== projectId || metadata.target === 'production' || metadata.readyState !== 'READY' || metadata.meta?.githubCommitRef !== 'customer-portal-test' || metadata.meta?.githubCommitSha !== commit) fail();
	const recoveryRunId = process.env.PROVIDER_RECOVERY_RUN_ID;
	const runId = recoveryRunId || crypto.randomUUID();
	if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(runId)) fail();
	await writeFile('isolated-provider-run.json', JSON.stringify({ runId, recovery: !!recoveryRunId, deployment: origin, sourceCommit: commit }) + '\n');
	console.log(`Isolated verification journal ID: ${runId}`);
	const { stdout } = await execute('npx', ['--yes', 'vercel@59.3.0', 'curl', '/api/health', '--deployment', origin, '--', '--silent', '--show-error', '--include', '--max-time', '330', '--request', 'POST', '--header', `Authorization: Bearer ${secret}`, '--header', 'Content-Type: application/json', '--data', JSON.stringify({ kind: 'verify-isolated-portal', acknowledgeTemporaryUsers: true, ...(recoveryRunId ? { recoveryRunId } : { runId }) })], { timeout: 360000, maxBuffer: 1024 * 1024 });
	const { response, text } = parseCurlResponse(stdout);
	const data = JSON.parse(text);
	// Copy only the fixed proof schema; never retain raw provider responses.
	const report = {
		deployment: origin, sourceCommit: commit, httpStatus: response.status,
		passed: data.passed === true && (recoveryRunId ? data.recovery === true && data.journalId === runId : data.sourceCommit === commit && data.project === 'zbchdxptibehtizomwiq'),
		checks: Array.isArray(data.checks) ? data.checks.map((check) => ({ name: String(check.name).replace(/[^a-z_]/g, '').slice(0, 80), passed: check.passed === true })) : [],
		cleanup: { passed: data.cleanup?.passed === true, attemptedUsers: Number(data.cleanup?.attemptedUsers) || 0, createdUsers: Number(data.cleanup?.createdUsers) || 0, removedUsers: data.cleanup?.removedUsers === null ? null : Number(data.cleanup?.removedUsers) || 0 },
		emailSent: data.emailSent === true,
	};
	if (!report.cleanup.passed && Array.isArray(data.cleanup?.temporaryUserIds)) report.cleanup.temporaryUserIds = data.cleanup.temporaryUserIds.filter((id) => /^[a-f0-9-]{36}$/.test(id));
	await writeFile('isolated-provider-verification.json', JSON.stringify(report, null, 2) + '\n');
	if (!response.ok || !report.passed || !report.cleanup.passed || (!recoveryRunId && report.checks.length !== 7) || report.checks.some((check) => !check.passed) || report.emailSent) fail();
	console.log('Isolated provider verification passed: seven stages and temporary-user cleanup confirmed. No inbox delivery was tested.');
} catch {
	console.error('Isolated provider verification refused or failed. No raw provider response or credential was logged.');
	process.exitCode = 1;
}
