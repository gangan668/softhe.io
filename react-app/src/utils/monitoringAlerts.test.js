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

	it('requires explicit aligned Preview configuration for controlled runtime tests', () => {
		const workflow = readFileSync(join(process.cwd(), '..', '.github', 'workflows', 'monitoring-alerts.yml'), 'utf8');
		expect(workflow).toContain('MONITOR_BASE_URL: ${{ vars.MONITOR_BASE_URL }}');
		expect(workflow).toContain('MONITOR_PREVIEW_BRANCH_CONFIGURED: ${{ vars.MONITOR_PREVIEW_BRANCH }}');
		expect(workflow).toContain('if [ -z "$MONITOR_BASE_URL" ] || [ -z "$MONITOR_PREVIEW_BRANCH_CONFIGURED" ]; then');
		expect(workflow).toContain('Controlled tests require MONITOR_BASE_URL and an explicit MONITOR_PREVIEW_BRANCH');
	});
});
