import { chromium } from '@playwright/test';
import process from 'node:process';
import { writeFile } from 'node:fs/promises';
import { checkDeployedBrowser } from './deployed-browser-checks.mjs';

const origin = new URL(process.env.PRODUCTION_BASE_URL || 'https://softhe.io').origin;
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem('softhe_analytics_consent', 'false'));
  // Optional short-lived connector share access stays in memory and is never written to evidence.
  if (process.env.SMOKE_VERCEL_SHARE_URL) {
    let entry;
    try { entry = new URL(process.env.SMOKE_VERCEL_SHARE_URL); }
    catch { throw new Error('The candidate share access URL is invalid'); }
    if (entry.origin !== origin) throw new Error('Share access must belong to the exact candidate origin');
    const page = await context.newPage();
    try { await page.goto(entry.href, { waitUntil: 'domcontentloaded', timeout: 30000 }); }
    catch { throw new Error('Protected candidate access failed; refresh its temporary access'); }
    finally { await page.close(); }
  }
  const evidence = await checkDeployedBrowser({
    context,
    origin,
    publicOrigin: process.env.EXPECTED_PUBLIC_ORIGIN || 'https://softhe.io',
    sourceCommit: process.env.EXPECTED_RELEASE_SOURCE_COMMIT,
    fingerprint: process.env.EXPECTED_RELEASE_FINGERPRINT,
  });
  if (process.env.SMOKE_BROWSER_EVIDENCE_FILE) await writeFile(process.env.SMOKE_BROWSER_EVIDENCE_FILE, JSON.stringify(evidence, null, 2));
  console.log(`Deployed browser smoke passed ${evidence.observations.length} route/viewport checks for ${origin}.`);
} finally {
  await browser.close();
}
