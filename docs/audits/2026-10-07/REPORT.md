# Main branch website audit, 2026-10-07

The informational website works across the routes and interactions checked, and production serves the current main release. It is not correct to say everything is working as intended. Live metadata and 404 styling defects remain, the current dependency audit fails, and the commercial release gate remains blocked.

## Scope and release identity

- Audited checkout and remote main: `77aead61515245e553efdda15fdaf4973b7e462a`.
- The audit checkout was clean and detached at that commit. `git ls-remote origin refs/heads/main` returned the same commit.
- Production origin: `https://softhe.io`.
- Live `/api/health`: HTTP 200, `ready`, source commit matching main, fingerprint `softhe-77aead6-stage1`, all seven configuration checks true.
- Runtime source, configuration, credentials, feature flags, and production were not modified. This folder contains the audit artifacts only.
- Prior audit notes were used to select regression areas. Findings below were rechecked against this checkout and current production.

## Verification results

| Check | Result | Interpretation |
| --- | --- | --- |
| Clean lockfile install | Passed | 279 packages installed; current advisory detected |
| ESLint | Passed | No lint errors |
| Existing unit and coverage gate | Passed | 35 files; 327 passed tests; 3 skipped |
| Focused coverage | Passed | Statements 86.65%; branches 81.12%; functions 90%; lines 89.31% |
| Whole frontend source inventory | Measured | Statements 59.42%; branches 55.06%; functions 55.70%; lines 67.91%; thresholds disabled for this inventory only |
| Strict enabled and disabled fixture builds | Passed | Configuration validation, bundling, metadata generation, and secret scans passed |
| Local desktop/mobile E2E | Passed | 62 enabled-profile checks and 4 disabled-profile checks |
| Existing asset budget | Passed with measurement gap | 77,660 bytes JavaScript and 8,866 bytes CSS, gzip |
| Dependency audit | Failed | One high-severity development dependency advisory |
| Benchmark manifest verifier | Passed | Median calculations agree with manifest |
| Commercial launch evidence | Failed as designed | Six pending evidence entries |
| Strict live smoke | Passed | App marker, security headers, real 404 status, serverless health, exact source commit |
| Production HTTP checks | Passed | All 19 route entry points, robots, sitemap, and unknown-route status behaved as expected |
| Observed same-origin assets | Passed | 14 assets returned HTTP 200 |
| Production browser routes | Rendered | All 19 requested routes checked at desktop and 390px mobile width; no measured horizontal overflow or observed broken images |
| Production interactive checks | Passed | FAQ search, expanded answer, empty state, product recommendation, mobile menu, navigation to contact |

The local E2E enabled profile uses fixture configuration and mocked contact, checkout, and withdrawal responses. It is not evidence of actual provider delivery. Its unknown-route assertion checks for a visible heading, not the intended 404 styling.

## Confirmed defects and gaps

### 1. Canonical URLs change to the Vercel project domain after hydration

Evidence: the fetched route entry points correctly identify `https://softhe.io`. After React loads, the homepage and most public routes identify `https://softhe-io.vercel.app` instead. Login, registration, forgot-password, and resend-confirmation do the same. See `production-browser-routes.json` and `production-http.json`.

Source: `react-app/src/config/site.js:3` trusts `VITE_APP_URL`; `SEO.jsx` uses that value. `scripts/routeMetadata.js:1` independently hardcodes the custom domain. This disagreement produces different metadata before and after hydration. The same `absoluteUrl` helper is also used for auth email callbacks, so those destinations need verification when correcting the public origin.

Recommendation: give static metadata, client metadata, and auth callbacks one validated public-origin source. Add direct-load and client-navigation tests against the deployed configuration. Priority: medium, with auth callback destination verification before release.

### 2. Four authentication pages overwrite noindex metadata

Evidence: `/login`, `/register`, `/forgot-password`, and `/resend-confirmation` start with `noindex, nofollow` and become `index, follow` after loading. Anonymous `/account` and `/admin` redirect to the same indexable login page.

Source: `AuthPage.jsx:54` renders `SEO` without `noIndex`; `SEO.jsx` defaults it to false. Direct `/reset-password` retains its static noindex, but `ResetPassword.jsx` has no metadata component, so metadata during client navigation is not explicitly managed.

Recommendation: centralize auth/private route metadata and enforce noindex through both direct loads and SPA transitions. Priority: medium.

### 3. Production 404 styling is blocked by production CSP

Evidence: the unknown route returns HTTP 404, but renders as a plain white browser-default page. `production-404.png` records the visible defect.

Source: `react-app/public/404.html:8` uses an inline style block. `vercel.json` sets `style-src 'self'`, which does not permit that block.

Recommendation: move the styles to a same-origin stylesheet and verify under the actual production policy. Retain the restrictive CSP. Priority: medium.

### 4. The dependency quality gate fails today

Evidence: `npm run audit:ci` reports `source-map-js@1.2.1`, advisory [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). The published patch is 1.2.2. `npm explain source-map-js` places it in development tooling through PostCSS/Vite and magicast/Vitest coverage.

Source: `react-app/package-lock.json:4009` pins the affected version. The CI quality workflow runs the same high-severity audit.

Recommendation: make a narrow lockfile update to the patched dependency, then rerun audit, builds, and the affected checks. This is a tooling exposure and a present CI failure; it does not establish a remotely exploitable issue in the deployed static frontend. Priority: medium, resolve before the next release.

### 5. The performance budget omits authentication startup JavaScript

Evidence: the budget reads only script and stylesheet paths directly present in `dist/index.html`. The disabled fixture build contains a 77,660-byte gzip application entry and a separate 56,035-byte gzip SDK chunk. Their combined JavaScript is 133,695 bytes, above the stated 122,880-byte JavaScript budget when the configured portal loads that chunk.

Source: `scripts/check-performance-budget.js:8` does not traverse imports or startup dynamic dependencies. `AuthProvider.jsx:15` calls `getSupabase` globally, including on public pages; configured portals dynamically import the SDK in `src/lib/supabase.js`.

Recommendation: measure entry imports plus dependencies actually loaded for anonymous and authenticated startup, deduplicating shared chunks. Consider deferring auth startup on public routes. These are artifact sizes, not a live Core Web Vitals measurement. Priority: medium.

### 6. Coverage does not represent all frontend source

Evidence: the normal report covers 1,001 lines and reports 89.31% line coverage. A separate inventory including every frontend JS/JSX source file covers 1,147 lines and reports 67.91% lines and 55.06% branches. Inventory and gate scopes differ, so their percentages are not interchangeable.

`AuthProvider`, `ProtectedRoute`, `AuthPage`, `ResetPassword`, `Account`, `Admin`, and `App` have no unit coverage in that inventory. Existing E2E smoke helps cover some public rendering and navigation, but does not exercise authenticated portal flows.

Recommendation: keep focused gating and whole-source reporting explicit; add behavioral tests for auth startup failure, recovery, staff denial, account operations, and route metadata. Priority: medium.

### 7. Authentication startup lacks failure recovery and asynchronous cleanup

Source inspection: `AuthProvider.jsx:15-22` has no rejection handler around client loading or `getSession`, and no active/unmounted guard around the asynchronous initialization. A failed initialization can leave loading true. If the effect unmounts before client creation completes, cleanup runs before the subscription exists and a later subscription can be left active.

This is a source-level failure-path defect, not an observed production outage. Recommendation: settle loading on failure, expose a recoverable state, and guard/dispose late initialization. Test rejected startup and unmount-before-resolution. Priority: medium.

### 8. Rate-limit timer cleanup and timer regressions remain incomplete

Source inspection: `useRateLimit.js` creates countdown and unblock timers without an unmount cleanup effect. `useRateLimit.test.js:82`, `:159`, and `:183` skip reset, custom-window, and countdown tests.

The current suite passing does not establish those timer behaviors. Recommendation: add deterministic timer tests and clear outstanding timers on unmount. No production rate-limit outage was reproduced. Priority: low to medium.

### 9. Benchmark publication copy contradicts the available archive

Evidence: `docs/benchmark-evidence.json` identifies a release archive containing four original captures. Its public URL returned HTTP 200 with an 8,086,382-byte binary asset. Homepage, store, and performance copy still says raw runs are unpublished, and the UI does not link readers to this archive.

Recommendation: verify the archive checksum and contents, then link it and update the publication status from one evidence source. This audit checked availability and manifest arithmetic, not archive integrity or the original capture process. Preserve the warning that Windows edition, memory settings, and GPU driver changed and that the comparison cannot isolate one product's effect. Priority: low.

## Intended behavior that worked

- Commerce is visibly disabled on production. Store prices remain readable; ordering controls are unavailable; direct checkout returns the visitor to the store.
- Contact shows direct email and Discord options while the online form is disabled.
- Anonymous account and admin routes redirect to login. The staff API returns 404, consistent with the disabled staff portal.
- Reset-password without a recovery token renders its expired/invalid-link guidance.
- All public and legal routes rendered at desktop and mobile widths. Local E2E also checked store overflow at 320, 390, 768, 1280, and 1440px.
- Header/footer navigation, service-to-product anchors, cart quantity/removal/dialog controls, consent persistence/reopening, skip-link focus, menu focus/Escape behavior, and mocked form response paths passed the local suite.
- CSP, MIME-sniffing prevention, frame denial, and referrer-policy headers passed strict live smoke. The policy itself needs the 404 asset compatibility fix, not relaxation.
- Read-only API probes returned expected safe states: health 200; staff 404; portal bootstrap GET 405; checkout-session without a valid session 400; Preview-only test-fulfillment 404.

## Launch and external verification boundaries

`npm run evidence:verify` rejects six pending entries:

1. `legal.counsel-approval`
2. `legal.accounting-approval`
3. `upstash.stripe-idempotency-record`
4. `stripe.async-payment-event`
5. `monitoring.stripe-webhook-alert`
6. `monitoring.fulfillment-alert`

Health checks configuration readiness. They do not prove successful payment, email delivery, retained records, fulfillment, or real alert delivery. This audit did not create accounts, submit real customer messages or withdrawals, purchase products, solve CAPTCHA, change credentials, or enable features. Authenticated account/ticket/staff operations, current database grants and RLS enforcement, provider workflows, and legal approvals remain outside fresh end-to-end verification.

The latest inspected scheduled [production smoke](https://github.com/gangan668/softhe.io/actions/runs/37627573470) and [monitoring run](https://github.com/gangan668/softhe.io/actions/runs/37631571268) succeeded at the same main commit. The prior [quality gate](https://github.com/gangan668/softhe.io/actions/runs/37165296089) succeeded, but that historical result does not override today's failed dependency audit. Existing recorded launch evidence was not re-certified.

## Reproduce and inspect

From `react-app`, run `npm ci`, `npm run lint`, `npm run test:coverage -- --run`, `npm run e2e:all`, `npm run budget`, `npm run audit:ci`, `npm run benchmark:verify`, and `npm run evidence:verify`.

For strict smoke, set `PRODUCTION_BASE_URL=https://softhe.io`, `REQUIRE_APP_MARKER=true`, `REQUIRE_SECURITY_HEADERS=true`, `REQUIRE_SERVERLESS_API=true`, and `EXPECTED_RELEASE_SOURCE_COMMIT=77aead61515245e553efdda15fdaf4973b7e462a`, then run `npm run smoke:production`.

From the repository root, run `node docs/audits/2026-10-07/check-production.mjs` for read-only HTTP and observed-asset verification. Browser evidence is in `production-browser-routes.json`, `production-mobile-routes.json`, `production-404.png`, and `production-mobile-store.png`. Coverage evidence is in `focused-coverage.json` and `whole-source-coverage.json`; generated interactive coverage reports remain in the ignored `react-app/coverage` directory.
