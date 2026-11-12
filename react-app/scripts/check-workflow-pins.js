import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

export const findUnpinnedActions = (source) => source.split(/\r?\n/).flatMap((line, index) => {
	const match = line.match(/^\s*(?:-\s*)?uses:\s*([^#]+?)(?:\s+#.*)?$/);
	if (!match) return [];
	const reference = match[1].trim().replace(/^(['"])(.*)\1$/, '$2');
	const isLocal = reference.startsWith('./');
	const isCommit = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_./-]+)?@[a-f0-9]{40}$/.test(reference);
	const isDigest = /^docker:\/\/[^\s@]+@sha256:[a-f0-9]{64}$/.test(reference);
	return isLocal || isCommit || isDigest ? [] : [{ line: index + 1, reference }];
});

export const checkWorkflowPins = async (directory = resolve(dirname(fileURLToPath(import.meta.url)), '../../.github/workflows')) => {
	const failures = [];
	for (const name of await readdir(directory)) {
		if (!/\.ya?ml(?:\.disabled)?$/.test(name)) continue;
		const source = await readFile(resolve(directory, name), 'utf8');
		for (const finding of findUnpinnedActions(source)) failures.push(`${name}:${finding.line}: ${finding.reference}`);
	}
	if (failures.length) throw new Error(`Pin external GitHub Actions to a full commit SHA or container digest:\n${failures.join('\n')}`);
};

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] || '')) {
	await checkWorkflowPins();
	console.log('All external workflow actions use immutable references.');
}
