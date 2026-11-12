import { describe, expect, it } from 'vitest';
import { checkWorkflowPins, findUnpinnedActions } from './check-workflow-pins.js';

describe('workflow action pins', () => {
	it('rejects movable refs for actions and reusable workflows', () => {
		const findings = findUnpinnedActions('  - uses: actions/checkout@v4\n    uses: org/repo/.github/workflows/build.yml@main\n  - uses: docker://image:latest');
		expect(findings).toHaveLength(3);
	});

	it('allows immutable commits and digests and repository-local actions', () => {
		const source = `  - uses: actions/checkout@${'a'.repeat(40)} # v4\n  - uses: "org/repo/action@${'b'.repeat(40)}"\n  - uses: ./local/action\n  - uses: docker://image@sha256:${'c'.repeat(64)}`;
		expect(findUnpinnedActions(source)).toEqual([]);
	});

	it('keeps committed active and disabled workflows pinned', async () => {
		await expect(checkWorkflowPins()).resolves.toBeUndefined();
	});
});
