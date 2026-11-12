import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { routeMetadata } from '../../../react-app/scripts/routeMetadata.js';

const origin = 'https://softhe.io';
const paths = [...routeMetadata.map(({ path }) => path), '/robots.txt', '/sitemap.xml', '/production-smoke-route-that-must-not-exist'];
const pages = [];
const assets = new Set();
const observedAssetsFile = new URL('./observed-assets.json', import.meta.url);
if (existsSync(observedAssetsFile)) {
  for (const url of JSON.parse(readFileSync(observedAssetsFile, 'utf8'))) {
    if (new URL(url).origin === origin) assets.add(new URL(url).pathname);
  }
}
for (const path of paths) {
  const response = await fetch(origin + path);
  const html = await response.text();
  pages.push({ path, status: response.status, title: html.match(/<title>(.*?)<\/title>/s)?.[1], canonical: html.match(/rel="canonical" href="([^"]+)"/)?.[1], robots: html.match(/name="robots" content="([^"]+)"/)?.[1], headers: Object.fromEntries(['content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'strict-transport-security'].map(name => [name, response.headers.get(name)])) });
  for (const match of html.matchAll(/(?:src|href)=["'](\/(?:assets|images|fonts)\/[^"']+)["']/g)) assets.add(match[1]);
}
const assetChecks = await Promise.all([...assets].map(async path => {
  const response = await fetch(origin + path, { method: 'HEAD' });
  return { path, status: response.status, contentType: response.headers.get('content-type') };
}));
const apiChecks = [];
for (const path of ['/api/health', '/api/staff?action=status', '/api/portal-bootstrap', '/api/checkout-session', '/api/test-fulfillment']) {
  const response = await fetch(origin + path);
  apiChecks.push({ path, status: response.status, body: await response.json().catch(() => null) });
}
const evidence = { checkedAt: new Date().toISOString(), origin, pages, assets: assetChecks, api: apiChecks };
writeFileSync(new URL('./production-http.json', import.meta.url), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ pages: pages.length, unexpectedPageStatuses: pages.filter(p => p.status !== (p.path.includes('must-not-exist') ? 404 : 200)), assets: assetChecks.length, failedAssets: assetChecks.filter(a => a.status !== 200), api: apiChecks }, null, 2));
