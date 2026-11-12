import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

const require = createRequire(import.meta.url);
const { beginProcessing, finishProcessing, reconcileProcessing, STUCK_AFTER_MS, RETENTION_SECONDS } = require('../../api/_lib/processing-attempts.js');
const container = process.env.PROCESSING_REDIS_TEST_CONTAINER;
if (!/^softhe-processing-test-[a-z0-9-]+$/.test(container || '')) throw new Error('Set PROCESSING_REDIS_TEST_CONTAINER to an isolated softhe-processing-test-* Redis container');
const quote = (value) => `'${String(value).replace(/'/g, "'\\''")}'`;
const command = async (args) => {
	const shell = ['sudo', 'docker', 'exec', container, 'redis-cli', '--json', ...args].map(quote).join(' ');
	const output = execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', '-p', '22', 'code1@192.168.1.224', shell], { encoding: 'utf8', timeout: 15000 });
	const result = JSON.parse(output);
	if (result && typeof result === 'object' && result.error) throw new Error(result.error);
	return result;
};

await command(['FLUSHDB']);
const now = Date.now();
const first = '11111111-1111-4111-8111-111111111111';
const retry = '22222222-2222-4222-8222-222222222222';
const session = 'cs_test_retained123';
const member = await beginProcessing('stripe', session, first, now - 60 * 60 * 1000, command);
assert.equal(await command(['TTL', 'operations:pending-processing']) > STUCK_AFTER_MS / 1000, true);
assert.equal(await command(['TTL', 'operations:processing-attempts']) > RETENTION_SECONDS - 120, true);
let result = await reconcileProcessing(now, command);
assert.equal(result.pending.stripe, 1, 'A start outside the 15-minute log window must remain discoverable');
await beginProcessing('stripe', session, retry, now, command);
assert.equal(await finishProcessing(member, first, command), 0, 'An old attempt must not remove the newer retry');
result = await reconcileProcessing(now, command);
assert.equal(result.pending.stripe, 1, 'A retry must preserve the oldest unresolved age');
await command(['SET', `stripe:fulfilled:${session}`, '{"status":"completed"}', 'EX', 7776000]);
result = await reconcileProcessing(now, command);
assert.equal(result.reconciled, 1, 'A completed stage must clean a pending index left by process termination');
assert.equal(result.pending.stripe, 0);
assert.equal(await command(['ZCARD', 'operations:pending-processing']), 0);

const active = await beginProcessing('fulfillment', 'cs_test_active123', first, now, command);
assert.equal((await reconcileProcessing(now, command)).checked, 0, 'A fresh attempt must not alert prematurely');
assert.equal(await finishProcessing(active, first, command), 1);
await beginProcessing('fulfillment', 'cs_test_received123', first, now - STUCK_AFTER_MS - 1, command);
await command(['SET', 'fulfillment:order:cs_test_received123', '{}']);
assert.equal((await reconcileProcessing(now, command)).reconciled, 1);

for (let index = 0; index < 101; index += 1) await beginProcessing('stripe', `cs_test_bounded${index}`, first, now - STUCK_AFTER_MS - 1, command);
result = await reconcileProcessing(now, command);
assert.equal(result.checked, 100);
assert.equal(result.pending.stripe, 100);
assert.equal(result.truncated, true, 'A bounded scan must report overflow rather than claim health');
await command(['FLUSHDB']);
console.log(JSON.stringify({ passed: true, engine: 'Redis 7.4 Lua', cases: ['retained old start', '400-day expiry', 'concurrent retry token', 'oldest retry age', 'completed Stripe cleanup', 'fresh attempt', 'normal completion', 'completed receiver cleanup', '100-record bound'] }, null, 2));
