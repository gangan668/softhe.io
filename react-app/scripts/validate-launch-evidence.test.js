import { describe, expect, it } from 'vitest';
import { requiredEvidenceIds, validateLaunchEvidence } from './validate-launch-evidence.js';

const validManifest = () => ({
	schemaVersion: 1,
	candidate: {
		origin: 'https://softhe-io.vercel.app',
		deploymentId: 'dpl_release_candidate',
		commitSha: '0123456789abcdef0123456789abcdef01234567',
		releaseFingerprint: 'release-2026-07-21-abcdef',
		strictSmokeRun: 'https://github.com/example/project/actions/runs/1234',
		verifiedAt: '2026-07-21T08:00:00Z',
	},
	evidence: Object.fromEntries(requiredEvidenceIds.map((id) => [id, {
		status: 'passed',
		verifiedAt: '2026-07-21T08:00:00Z',
		verifiedBy: 'Release verifier',
		references: [`https://evidence.example/${id}`],
	}])),
});

describe('launch evidence validation', () => {
	it('accepts a complete manifest for the expected candidate', () => {
		const manifest = validManifest();
		expect(validateLaunchEvidence(manifest, {
			origin: manifest.candidate.origin,
			commitSha: manifest.candidate.commitSha,
			releaseFingerprint: manifest.candidate.releaseFingerprint,
		})).toEqual([]);
	});

	it('reports missing and pending evidence', () => {
		const manifest = validManifest();
		delete manifest.evidence['stripe.duplicate-webhook'];
		manifest.evidence['legal.counsel-approval'].status = 'pending';
		manifest.evidence['legal.counsel-approval'].references = [];
		const errors = validateLaunchEvidence(manifest);
		expect(errors).toContain('stripe.duplicate-webhook: evidence entry is missing');
		expect(errors).toContain('legal.counsel-approval: status must be passed');
	});

	it('rejects a manifest for a different deployment target or commit', () => {
		const errors = validateLaunchEvidence(validManifest(), {
			origin: 'https://softhe.io',
			commitSha: 'abcdef0',
			releaseFingerprint: 'different-release',
		});
		expect(errors).toContain('candidate.origin does not match EVIDENCE_EXPECTED_ORIGIN (https://softhe.io)');
		expect(errors).toContain('candidate.commitSha does not match EVIDENCE_EXPECTED_COMMIT (abcdef0)');
		expect(errors).toContain('candidate.releaseFingerprint does not match EVIDENCE_EXPECTED_RELEASE_FINGERPRINT');
	});

	it('rejects placeholders even when an item is marked passed', () => {
		const manifest = validManifest();
		manifest.evidence['approval.release-owner'].verifiedBy = 'TBD';
		manifest.evidence['approval.release-owner'].references = ['pending'];
		const errors = validateLaunchEvidence(manifest);
		expect(errors).toContain('approval.release-owner: verifiedBy must name the verifier');
		expect(errors).toContain('approval.release-owner: evidence references cannot be empty or placeholders');
	});
});
