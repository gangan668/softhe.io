#!/usr/bin/env node

/**
 * Post-build script for GitHub Pages deployment
 * Creates a .nojekyll file to prevent Jekyll processing
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = join(__dirname, '..', 'dist');
const nojekyllPath = join(distPath, '.nojekyll');

try {
	writeFileSync(nojekyllPath, '', 'utf8');
	console.log('✅ Created .nojekyll file in dist/');
} catch (error) {
	console.error('❌ Error creating .nojekyll file:', error.message);
	process.exit(1);
}
