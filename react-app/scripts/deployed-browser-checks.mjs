import assert from 'node:assert/strict';
import { isPrivateRoute } from '../src/config/routePolicy.js';

const routes = ['/', '/services', '/store', '/performance', '/faq', '/contact', '/terms', '/privacy-policy', '/cookie-policy', '/legal-notice', '/withdrawal', '/checkout', '/login', '/register', '/forgot-password', '/resend-confirmation', '/reset-password', '/account', '/admin'];

// This probe reads deployed pages without submitting forms or creating accounts.
export async function checkDeployedBrowser({ context, origin, publicOrigin = 'https://softhe.io', sourceCommit, fingerprint, widths = [390, 1440] }) {
  const healthResponse = await context.request.get(`${origin}/api/health`);
  assert.equal(healthResponse.status(), 200, 'Deployed health must return HTTP 200');
  const health = await healthResponse.json();
  assert.equal(health.status, 'ready', 'Deployed health is not ready');
  assert(Object.values(health.checks || {}).length >= 7 && Object.values(health.checks).every(Boolean), 'Deployed readiness checks are incomplete');
  if (sourceCommit) assert.equal(health.release?.sourceCommit, sourceCommit, 'Deployed source commit differs from the candidate');
  if (fingerprint) assert.equal(health.release?.fingerprint, fingerprint, 'Deployed release fingerprint differs from the candidate');
  const observations = [];
  for (const width of widths) {
    for (const route of [...routes, '/production-browser-route-that-must-not-exist']) {
      const page = await context.newPage();
      try {
        await page.setViewportSize({ width, height: 900 });
        const exceptions = [];
        const styleViolations = [];
        page.on('pageerror', error => exceptions.push(error.message));
        page.on('console', message => {
          if (/inline style.*Content Security Policy|Refused to apply inline style/i.test(message.text())) styleViolations.push(message.text());
        });
        const response = await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const unknown = !routes.includes(route);
        assert.equal(response.status(), unknown ? 404 : 200, `${route} returned an unexpected HTTP status`);
        const html = await response.text();
        if (!unknown) {
          assert(html.includes('softhe-app'), `${route} did not return the application`);
          const staticRobots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)/i)?.[1];
          assert.equal(staticRobots, isPrivateRoute(route) ? 'noindex, nofollow' : 'index, follow', `${route} has incorrect initial robots metadata`);
          const staticCanonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)/i)?.[1];
          assert.equal(staticCanonical, new URL(route, `${publicOrigin}/`).href, `${route} has an incorrect initial canonical URL`);
        }
        await page.locator('h1').first().waitFor({ timeout: 15000 });
        const state = await page.evaluate(() => ({
          path: location.pathname,
          title: document.title,
          canonical: document.querySelector('link[rel="canonical"]')?.href,
          robots: document.querySelector('meta[name="robots"]')?.content,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          brokenImages: [...document.images].filter(image => image.complete && !image.naturalWidth).length,
        }));
        if (!unknown) {
          assert.equal(state.canonical, new URL(state.path, `${publicOrigin}/`).href, `${route} has an incorrect hydrated canonical URL`);
          assert.equal(state.robots, isPrivateRoute(state.path) ? 'noindex, nofollow' : 'index, follow', `${route} has incorrect hydrated robots metadata`);
          if (route === '/account' || route === '/admin') assert.equal(state.path, '/login', `${route} must protect anonymous access`);
        } else {
          assert.equal(state.robots, 'noindex, nofollow', 'The static 404 must not be indexed');
          assert.equal(styleViolations.length, 0, 'The static 404 violates the style CSP');
        }
        assert.equal(state.overflow, false, `${route} overflows at ${width}px`);
        assert.equal(state.brokenImages, 0, `${route} has broken images`);
        assert.equal(exceptions.length, 0, `${route} raised a page exception`);
        observations.push({ route, width, status: response.status(), ...state });
      } finally {
        await page.close();
      }
    }
  }
  return { origin, checkedAt: new Date().toISOString(), release: health.release, observations };
}
