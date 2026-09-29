import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const script = join(process.cwd(), 'scripts', 'check-monitoring-alerts.js');

const runMonitor = (reviewEvents) => {
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
		},
		});
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
};

describe('monitoring alert checker', () => {
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
		for (const event of ['browser_error', 'delivery_failed', 'stripe_confirmation_requires_review']) {
			for (const scope of ['--environment production', '--branch customer-portal-test']) {
				expect(lines.some((line, index) => line.includes(`logs ${scope} --since 15m`)
					&& lines[index + 1]?.includes(`--query ${event} --json`))).toBe(true);
			}
		}
	});
});
