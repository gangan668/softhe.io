#!/usr/bin/env node

/**
 * Generate route-specific HTML entry points for static metadata and direct links.
 * Vercel serves these files before the React application hydrates each route.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import process from 'process';
import { routeMetadata, siteUrl, socialImage } from './routeMetadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = join(__dirname, '..', 'dist');

const escapeAttribute = (value) => value
	.replaceAll('&', '&amp;')
	.replaceAll('"', '&quot;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;');

const replaceTag = (html, pattern, markup) => {
	return pattern.test(html) ? html.replace(pattern, markup) : html.replace('</head>', `  ${markup}\n  </head>`);
};

const renderRoute = (template, route) => {
	const canonical = `${siteUrl}${route.path === '/' ? '/' : route.path}`;
	const title = escapeAttribute(route.title);
	const description = escapeAttribute(route.description);
	let html = replaceTag(template, /<title>.*?<\/title>/i, `<title>${title}</title>`);
	html = replaceTag(html, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${description}">`);
	html = replaceTag(html, /<meta\s+name=["']robots["'][^>]*>/i, `<meta name="robots" content="${route.robots || 'index, follow'}">`);
	html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}">`);
	html = replaceTag(html, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${title}">`);
	html = replaceTag(html, /<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${description}">`);
	html = replaceTag(html, /<meta\s+property=["']og:type["'][^>]*>/i, `<meta property="og:type" content="${route.type || 'website'}">`);
	html = replaceTag(html, /<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${canonical}">`);
	html = replaceTag(html, /<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${socialImage}">`);
	html = replaceTag(html, /<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${title}">`);
	html = replaceTag(html, /<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${description}">`);
	html = replaceTag(html, /<meta\s+name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${socialImage}">`);
	return html;
};

try {
	const templatePath = join(distPath, 'index.html');
	const template = readFileSync(templatePath, 'utf8');
	for (const route of routeMetadata) {
		if (route.path === '/') {
			writeFileSync(templatePath, renderRoute(template, route), 'utf8');
			continue;
		}
		const outputDirectory = join(distPath, ...route.path.slice(1).split('/'));
		mkdirSync(outputDirectory, { recursive: true });
		writeFileSync(join(outputDirectory, 'index.html'), renderRoute(template, route), 'utf8');
	}
	console.log(`Generated metadata entry points for ${routeMetadata.length} routes.`);
} catch (error) {
	console.error('Error generating route metadata:', error.message);
	process.exit(1);
}
