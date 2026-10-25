import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.env.AUDIT_ORIGIN || 'https://softhe.io';
const output = new URL('../../docs/audits/2026-10-25/', import.meta.url);
await mkdir(output, { recursive: true });
const routes = ['/', '/services', '/store', '/performance', '/faq', '/contact', '/terms', '/privacy-policy', '/cookie-policy', '/legal-notice', '/withdrawal', '/checkout', '/login', '/register', '/forgot-password', '/resend-confirmation', '/reset-password', '/account', '/admin', '/audit-unknown-route'];
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(() => localStorage.setItem('softhe_analytics_consent', 'false'));
    for (const route of routes) {
      const page = await context.newPage();
      const errors = [];
      const failedResources = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => {
        if (response.status() >= 400 && response.request().resourceType() !== 'document') {
          const url = new URL(response.url());
          failedResources.push({ url: `${url.origin}${url.pathname.split('/').slice(0, 6).join('/')}`, status: response.status() });
        }
      });
      try {
        const response = await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.locator('h1, [role="alert"], .portal-state').first().waitFor({ timeout: 10000 });
        await page.waitForTimeout(700);
        const state = await page.evaluate(() => ({
          pathname: location.pathname,
          title: document.title,
          headings: [...document.querySelectorAll('h1')].map(element => element.textContent),
          canonical: document.querySelector('link[rel="canonical"]')?.href,
          robots: document.querySelector('meta[name="robots"]')?.content,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          brokenImages: [...document.images].filter(image => image.complete && !image.naturalWidth).map(image => image.getAttribute('src')),
          orderUnavailable: /Online (ordering is unavailable|checkout is being prepared)|Ordering temporarily unavailable/i.test(document.body.innerText),
          contactForm: Boolean(document.querySelector('input[name="email"]')),
          links: [...document.querySelectorAll('a[href]')].map(link => link.href),
        }));
        results.push({ width, route, status: response.status(), ...state, errors, failedResources });
        if (['/', '/store', '/contact'].includes(route)) await page.screenshot({ path: new URL(`production-${width}-${route === '/' ? 'home' : route.slice(1)}.png`, output).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true });
      } catch (error) { results.push({ width, route, error: error.message, errors, failedResources }); }
      console.log(`Checked ${width}px ${route}`);
      await writeFile(new URL('production-browser.json', output), JSON.stringify({ origin, checkedAt: new Date().toISOString(), results }, null, 2));
      await page.close();
    }
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(new URL('production-browser.json', output), JSON.stringify({ origin, checkedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify({ origin, routeChecks: results.length, issues: results.filter(row => row.error || row.overflow || row.errors?.length || row.failedResources?.length || row.brokenImages?.length), store: results.filter(row => row.route === '/store').map(({width,orderUnavailable}) => ({width,orderUnavailable})) }, null, 2));
