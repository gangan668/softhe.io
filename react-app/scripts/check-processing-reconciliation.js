import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import process from 'node:process';

export function checkReconciliation(result) {
	if (!result || !['ready', 'attention-required'].includes(result.status)
		|| typeof result.truncated !== 'boolean'
		|| ![result.checked, result.reconciled, result.pending?.stripe, result.pending?.fulfillment].every((value) => Number.isInteger(value) && value >= 0)) {
		throw new Error('Invalid processing reconciliation response');
	}
	if (result.status !== 'ready' || result.truncated || result.pending.stripe || result.pending.fulfillment) {
		throw new Error(`Durable processing alert: ${result.pending.stripe} Stripe and ${result.pending.fulfillment} fulfillment attempt(s) require review; scan truncated: ${result.truncated}`);
	}
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] || '')) {
	checkReconciliation(JSON.parse(readFileSync(process.argv[2], 'utf8')));
	console.log('Durable processing reconciliation passed.');
}
