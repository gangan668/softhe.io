import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import process from 'node:process';

const distDirectory = join(process.cwd(), 'dist');
const html = readFileSync(join(distDirectory, 'index.html'), 'utf8');
const assetPaths = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+\.(?:js|css))["']/g)]
	.map((match) => match[1]);

const totals = assetPaths.reduce((result, assetPath) => {
	const filePath = join(distDirectory, assetPath.replace(/^\//, ''));
	const extension = assetPath.endsWith('.js') ? 'js' : 'css';
	result[extension] += gzipSync(readFileSync(filePath)).byteLength;
	result.files.push({ assetPath, bytes: statSync(filePath).size });
	return result;
}, { js: 0, css: 0, files: [] });

const budgets = { js: 120 * 1024, css: 24 * 1024 };
for (const extension of ['js', 'css']) {
	if (totals[extension] > budgets[extension]) {
		throw new Error(`Initial ${extension.toUpperCase()} is ${totals[extension]} gzipped bytes; budget is ${budgets[extension]}.`);
	}
}

console.log(`Performance budget passed: ${totals.js} B JS and ${totals.css} B CSS gzipped.`);
