import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const script = join(process.cwd(), 'scripts', 'check-monitoring-alerts.js');

const runMonitor = (reviewEvents, options = {}) => {
	const directory = mkdtempSync(join(tmpdir(), 'softhe-monitor-'));
	try {
		const emptyLog = join(directory, 'empty.jsonl');
		const reviewLog = join(directory, 'reviews.jsonl');
		writeFileSync(emptyLog, '');
		writeFileSync(reviewLog, reviewEvents.map((event) => JSON.stringify(event)).join('\n'));
		return spawnSync(process.execPath, [script], {
			encoding: 'utf8',
			env: {
			...process.env,
			TEST_ALERT: 'none',
			BROWSER_LOG_FILE: emptyLog,
			DELIVERY_LOG_FILE: emptyLog,
			CONFIRMATION_REVIEW_LOG_FILE: reviewLog,
            STRIPE_LOG_FILE: options.stripe ? reviewLog : emptyLog,
            FULFILLMENT_LOG_FILE: options.fulfillment ? reviewLog : emptyLog,
            ...options.env,
		},
		});
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
};

describe('monitoring alert checker', () => {
	it.each(['stripe', 'fulfillment'])('detects %s operational failures', (kind) => {
		const marker = kind === 'stripe' ? 'stripe_webhook_failed' : 'fulfillment_processing_failed';
		const result = runMonitor([{ message: marker }], { [kind]: true });
		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain(kind === 'stripe' ? '1 Stripe webhook failure' : '1 fulfillment failure');
	});
	it.each(['stripe', 'fulfillment'])('requires synthetic %s detection', (kind) => {
		const result = runMonitor([], { env: { TEST_ALERT: kind } });
		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain('was not detected');
	});
	it('fails closed when a configured log file is missing', () => {
		const result = runMonitor([], { env: { STRIPE_LOG_FILE: join(tmpdir(), 'missing-softhe-monitor-log.jsonl') } });
		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain('ENOENT');
	});
	it('fails closed when a log line is malformed', () => {
		const directory = mkdtempSync(join(tmpdir(), 'softhe-invalid-monitor-'));
		try {
			const path = join(directory, 'invalid.jsonl');
			writeFileSync(path, '{not-json');
			const result = runMonitor([], { env: { STRIPE_LOG_FILE: path } });
			expect(result.status).not.toBe(0);
			expect(result.stderr).toContain('malformed JSON');
		} finally { rmSync(directory, { recursive: true, force: true }); }
	});
	it('passes when no monitored errors are present', () => {
		const result = runMonitor([]);
		expect(result.status).toBe(0);
	});

	it('fails on a confirmation requiring manual review', () => {
		const result = runMonitor([{ message: 'stripe_confirmation_requires_review', sessionId: 'cs_test_1' }]);
		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain('1 confirmation review event(s)');
	});

	it('checks public Production health and searches both log environments', () => {
		const workflow = readFileSync(join(process.cwd(), '..', '.github', 'workflows', 'monitoring-alerts.yml'), 'utf8');
		const lines = workflow.split(/\r?\n/);
		expect(workflow).toContain('https://softhe.io/api/health');
		expect(workflow).toContain('npx --yes vercel@59.3.0 curl /api/health --deployment "$MONITOR_BASE_URL"');
		expect(workflow).toContain("MONITOR_PREVIEW_BRANCH: ${{ vars.MONITOR_PREVIEW_BRANCH || 'customer-portal-test' }}");
		for (const event of ['browser_error', 'delivery_failed', 'stripe_confirmation_requires_review']) {
			for (const scope of ['--environment production', '--branch "$MONITOR_PREVIEW_BRANCH"']) {
				expect(lines.some((line, index) => line.includes(`logs ${scope} --since 15m`)
					&& lines[index + 1]?.includes(`--query ${event} --json`))).toBe(true);
			}
		}
	});

	it('authenticates detailed health checks with the HEALTH_CHECK_TOKEN secret', () => {
		const read = (name) => readFileSync(join(process.cwd(), '..', '.github', 'workflows', name), 'utf8');
		for (const name of ['monitoring-alerts.yml', 'release-gate.yml', 'production-smoke.yml']) {
			expect(read(name)).toContain('HEALTH_CHECK_TOKEN: ${{ secrets.HEALTH_CHECK_TOKEN }}');
		}
		// Every smoke step in the scheduled smoke (HTTP and browser) receives the token.
		expect(read('production-smoke.yml').match(/HEALTH_CHECK_TOKEN: \$\{\{ secrets\.HEALTH_CHECK_TOKEN \}\}/g)).toHaveLength(2);
		expect(read('release-gate.yml').match(/HEALTH_CHECK_TOKEN: \$\{\{ secrets\.HEALTH_CHECK_TOKEN \}\}/g)).toHaveLength(3);
		expect(read('monitoring-alerts.yml')).toContain('health_auth=(--header "Authorization: Bearer $HEALTH_CHECK_TOKEN")');
		expect(read('monitoring-alerts.yml')).toContain('"${health_auth[@]}" https://softhe.io/api/health');
		expect(read('release-gate.yml')).toContain('--max-time 30 "${health_auth[@]}" > candidate-health.json');
		const script = (name) => readFileSync(join(process.cwd(), 'scripts', name), 'utf8');
		expect(script('production-smoke.js')).toContain('Authorization: `Bearer ${healthCheckToken}`');
		expect(script('deployed-browser-checks.mjs')).toContain('Authorization: `Bearer ${healthToken}`');
		expect(script('vercel-smoke-request.js')).toContain("['--header', `${key}: ${value}`]");
	});

	it('requires explicit aligned Preview configuration for controlled runtime tests', () => {
		const workflow = readFileSync(join(process.cwd(), '..', '.github', 'workflows', 'monitoring-alerts.yml'), 'utf8');
		expect(workflow).toContain('MONITOR_BASE_URL: ${{ vars.MONITOR_BASE_URL }}');
		expect(workflow).toContain('MONITOR_PREVIEW_BRANCH_CONFIGURED: ${{ vars.MONITOR_PREVIEW_BRANCH }}');
		expect(workflow).toContain('if [ -z "$MONITOR_BASE_URL" ] || [ -z "$MONITOR_PREVIEW_BRANCH_CONFIGURED" ]; then');
		expect(workflow).toContain('Controlled tests require MONITOR_BASE_URL and an explicit MONITOR_PREVIEW_BRANCH');
	});
});
