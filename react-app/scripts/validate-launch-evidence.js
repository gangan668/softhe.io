import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import process from 'node:process';

export const requiredEvidenceIds = [
	'legal.operator-identity',
	'legal.counsel-approval',
	'legal.accounting-approval',
	'benchmark.methodology-and-raw-runs',
	'ui.responsive-review',
	'emailjs.contact-delivery',
	'emailjs.order-delivery',
	'emailjs.withdrawal-acknowledgement',
	'emailjs.withdrawal-operator-notification',
	'upstash.rate-limit-record',
	'upstash.withdrawal-record-and-retention',
	'upstash.stripe-idempotency-record',
	'stripe.completed-test-order',
	'stripe.duplicate-webhook',
	'stripe.async-payment-event',
	'fulfillment.accepted-order',
	'fulfillment.deduplicated-order',
	'fulfillment.retry-and-reconciliation',
	'monitoring.uptime-alert',
	'monitoring.browser-error-alert',
	'monitoring.delivery-failure-alert',
	'monitoring.stripe-webhook-alert',
	'monitoring.fulfillment-alert',
	'rollback.dns-export',
	'rollback.rehearsal',
	'approval.release-owner',
	'approval.rollback-owner',
];

const placeholderPattern = /^(?:pending|todo|tbd|unknown|replace|example|n\/a|none)(?:\b|:)/i;

const meaningful = (value) => typeof value === 'string'
	&& value.trim().length >= 3
	&& !placeholderPattern.test(value.trim());

const validTimestamp = (value) => meaningful(value)
	&& /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
	&& !Number.isNaN(Date.parse(value));

const validHttpsOrigin = (value) => {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' && url.origin === value;
	} catch {
		return false;
	}
};

export const validateLaunchEvidence = (manifest, expected = {}) => {
	const errors = [];
	if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
		return ['manifest must be a JSON object'];
	}

	if (manifest.schemaVersion !== 1) errors.push('schemaVersion must be 1');
	const candidate = manifest.candidate || {};
	if (!validHttpsOrigin(candidate.origin)) errors.push('candidate.origin must be an HTTPS origin without a path');
	if (!meaningful(candidate.deploymentId)) errors.push('candidate.deploymentId is required');
	if (!/^[a-f0-9]{7,40}$/i.test(candidate.commitSha || '')) errors.push('candidate.commitSha must be a 7-40 character Git commit SHA');
	if (!meaningful(candidate.releaseFingerprint)) errors.push('candidate.releaseFingerprint is required');
	if (!meaningful(candidate.strictSmokeRun)) errors.push('candidate.strictSmokeRun is required');
	if (!validTimestamp(candidate.verifiedAt)) errors.push('candidate.verifiedAt must be an ISO timestamp');

	if (expected.origin && candidate.origin !== expected.origin) {
		errors.push(`candidate.origin does not match EVIDENCE_EXPECTED_ORIGIN (${expected.origin})`);
	}
	if (expected.commitSha && candidate.commitSha !== expected.commitSha) {
		errors.push(`candidate.commitSha does not match EVIDENCE_EXPECTED_COMMIT (${expected.commitSha})`);
	}
	if (expected.releaseFingerprint && candidate.releaseFingerprint !== expected.releaseFingerprint) {
		errors.push('candidate.releaseFingerprint does not match EVIDENCE_EXPECTED_RELEASE_FINGERPRINT');
	}

	const evidence = manifest.evidence || {};
	for (const id of requiredEvidenceIds) {
		const item = evidence[id];
		if (!item || typeof item !== 'object') {
			errors.push(`${id}: evidence entry is missing`);
			continue;
		}
		if (item.status !== 'passed') {
			errors.push(`${id}: status must be passed`);
			continue;
		}
		if (!validTimestamp(item.verifiedAt)) errors.push(`${id}: verifiedAt must be an ISO timestamp`);
		if (!meaningful(item.verifiedBy)) errors.push(`${id}: verifiedBy must name the verifier`);
		if (!Array.isArray(item.references) || item.references.length === 0) {
			errors.push(`${id}: at least one evidence reference is required`);
		} else if (item.references.some((reference) => !meaningful(reference))) {
			errors.push(`${id}: evidence references cannot be empty or placeholders`);
		}
	}

	return errors;
};

const run = async () => {
	const evidencePath = resolve(process.env.LAUNCH_EVIDENCE_FILE || '../docs/launch-evidence.json');
	const manifest = JSON.parse(await readFile(evidencePath, 'utf8'));
	const errors = validateLaunchEvidence(manifest, {
		origin: process.env.EVIDENCE_EXPECTED_ORIGIN,
		commitSha: process.env.EVIDENCE_EXPECTED_COMMIT,
		releaseFingerprint: process.env.EVIDENCE_EXPECTED_RELEASE_FINGERPRINT,
	});
	if (errors.length) {
		throw new Error(`Launch evidence is incomplete:\n- ${errors.join('\n- ')}`);
	}
	console.log(`Launch evidence verified for ${manifest.candidate.origin} at ${manifest.candidate.commitSha}.`);
};

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] || '')) {
	await run();
}
