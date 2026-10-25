# Website audit, 2026-10-25

## Verdict

Current main passes the functional tests exercised in this audit. It does not pass the dependency security gate today, and commercial release evidence remains incomplete. The public website is reachable and correctly presents ordering as unavailable, but it reports an older source commit and has reproducible metadata regressions after React hydration. A green production smoke result is insufficient to qualify current main or commercial operation.

## Scope and identity

- Fetched `origin/main` and audited `7ca108b5ce2a4abde28907cab912a9d520357ba8`, the merged PR #17 state. The worktree initially contained `390d372`; it was clean before moving the detached checkout to remote main. The separate local `main` branch was not changed.
- Examined routing, navigation, cart and pricing, contact and withdrawal flows, account and staff protections, analytics consent, metadata, server validation, database policies, build configuration, deployment headers, launch evidence, and test coverage.
- Exercised local production builds in enabled, disabled, and portal fixture configurations. Portal/browser provider responses are mocked. Local migration tests use a disposable PGlite database.
- Swept 20 public, authentication, protected, checkout, and unknown paths at 390px and 1440px on `https://softhe.io`. Saved the 40 observations and six screenshots alongside this report.
- The public health response reports source `77aead61515245e553efdda15fdaf4973b7e462a`, fingerprint `softhe-77aead6-stage1`. This is the endpoint's reported identity, not an independent attestation of every deployed file.
- No application behavior, dependencies, provider configuration, production data, release flags, or deployment mappings were changed. Audit tooling and evidence were added locally. Nothing was committed or pushed.

## Findings

### 1. High priority: current dependency audit blocks the main quality gate

`npm ci` installed the checked-in lockfile successfully. `npm audit` reports six affected packages: two high and four moderate. Installed Vite 7.3.6 is high severity; Zod 4.4.3, brought in through eslint-plugin-react-hooks, is high severity. Vitest 4.1.11 and its UI, coverage, and mocker packages account for the moderate entries. These are development dependencies. The production-only audit reports zero vulnerabilities.

The checked-in `.github/workflows/quality-gate.yml` runs `npm audit --audit-level=high`. That command fails against this lockfile today, regardless of older successful workflow runs. This audit did not independently inspect current hosted workflow status.

Update Vite within its supported release line, update Vitest/UI/coverage together to a patched matching version, and refresh the affected Zod dependency. Re-run the existing quality gate after changing the lockfile. No automatic audit fix was applied during this analysis.

References: [Vite Windows editor command advisory](https://github.com/advisories/GHSA-587h-7wmj-h5pm), [Zod constrained collection advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), [Vitest mock registration advisory](https://github.com/advisories/GHSA-qxg6-89mg-rqv8). Full dependency paths and audit results are in `dependencies.json`.

### 2. High priority: production hydration overwrites correct metadata

The server response for `/login` correctly includes canonical `https://softhe.io/login` and `noindex, nofollow`. After the application loads, the same page declares canonical `https://softhe-io.vercel.app/login` and `index, follow`.

The sweep reproduces the wrong canonical host across public pages and the incorrect indexing policy on login, registration, password recovery, and confirmation resend pages. Unauthenticated `/account` and `/admin` redirect to the affected login page. This concerns indexing and canonical signals; it does not demonstrate disclosure of authenticated content.

Current main's metadata browser tests pass with `https://softhe.io` canonicals and private-route `noindex`. Qualify a deployment of current main with its real public-origin configuration, checking metadata both before and after hydration. Do not assume that correct initial HTML or the existing HTTP smoke detects this regression.

### 3. Release qualification: public production does not report current main

Public health returns HTTP 200 `ready`, with all seven checks true, while reporting `77aead6`. Main is `7ca108b`. The public homepage still says the raw benchmark runs are unpublished, whereas main publishes the archive reference and passes its benchmark evidence verifier. Production also serves the older Google Analytics CSP allowances, while main's policy has removed them.

These observations substantiate deployment drift. Passing tests of main cannot be presented as verification that its fixes are live. Promotion requires a separately qualified candidate and release-owner authorization. Production was not promoted during this audit.

### 4. Commercial release remains blocked by six evidence items

`npm run evidence:verify` fails because these entries are not passed:

- `legal.counsel-approval`
- `legal.accounting-approval`
- `upstash.stripe-idempotency-record`
- `stripe.async-payment-event`
- `monitoring.stripe-webhook-alert`
- `monitoring.fulfillment-alert`

This is an intentional release gate, not a reason to bypass it. The live store presents ordering as unavailable, and direct checkout navigates to the store. Configuration health is not proof of payment settlement, fulfillment, email delivery, legal approval, or alert receipt.

### 5. Authentication needs provider-backed verification

Live login, registration, forgot-password, and confirmation pages load, but automated Chromium records Cloudflare challenge diagnostics, including HTTP 401 on a challenge PAT resource and CSP messages from the challenge context. Those messages refer to Cloudflare's own challenge policy, not the application's configured `connect-src` policy. They are insufficient to establish that human authentication fails.

The portal fixture suite passes login, profile persistence, ticket history, signout, denied staff access, identity replacement, and deferred-request isolation. It explicitly disables CAPTCHA. Real CAPTCHA completion, Auth delivery, account recovery, MFA, and authenticated hosted ticket/staff operations remain unverified in this audit. No accounts were created and no messages were sent.

### 6. Medium priority: public static 404 styling violates production CSP

An unknown direct URL correctly returns HTTP 404 and `noindex, nofollow`, but its static page attempts to apply an inline style that the deployed `style-src 'self'` policy blocks. The browser reproduces this at both viewport widths. The expected document-404 console message is separate from the unexpected CSP styling error.

Current main passes its explicit static-404 styling test under the strict policy. Include direct unknown-URL rendering in deployment qualification so the repaired markup and the deployed headers are verified together.

## Verification results

| Check | Result |
| --- | --- |
| Clean dependency install | Passed, with dependency audit findings |
| ESLint | Passed |
| Unit suite | 553 tests across 56 files passed |
| Focused coverage gate | Passed: 87.38% statements, 81.90% branches, 84.13% functions, 91.58% lines |
| Whole-frontend coverage inventory | 87.37% statements, 81.34% branches, 81.62% functions, 90.56% lines |
| Disposable database security tests | Passed migration replay, service RPCs, browser bypass denial, cross-customer denial, closed/suspended account denial, invalid input denial |
| Enabled browser mode | 74 passed |
| Disabled browser mode | 14 passed |
| Portal browser mode | 24 passed |
| Strict production fixture builds | All three passed |
| Built client secret scans | Passed in all three builds |
| Asset performance budgets | Passed all measured scenarios |
| Benchmark evidence verifier | Passed, stock 658.21 / optimized 825.83 average FPS medians |
| Production-only dependency audit | Zero vulnerabilities |
| Full dependency security gate | Failed: two high, four moderate affected packages |
| Commercial launch evidence | Failed: six missing items |
| Strict public production smoke | Passed app markers, headers, selected routes, real HTTP 404, and API health |
| Additional production browser sweep | 40 completed route/viewport checks; no horizontal overflow or broken images; metadata and static-404 CSP findings plus authentication challenge diagnostics recorded |

The 112 local browser checks exercise navigation and destinations, store recommendation and service anchors, cart quantities/removal, checkout consent and safe failure, contact and withdrawal response handling, FAQ filtering/search, cookie persistence/settings, consented analytics sanitization, focus movement and trapping, static and SPA 404 behavior, metadata transitions, and portal access/isolation. Responsive checks include 320, 390, 768, 1280, and 1440px within the relevant suites. Browser projects are Chromium desktop and mobile emulation; Firefox, Safari, and physical devices were not tested.

Anonymous home uses 81,963 gzipped JS bytes against a 122,880-byte limit. The largest measured authenticated public scenario is FAQ at 141,603 bytes against 143,360, so it has little remaining JS budget. These are transfer-size budgets, not field Core Web Vitals measurements.

Coverage percentages do not prove full behavior coverage. The whole-frontend inventory shows zero unit coverage for several legal/static pages, Services, Withdrawal, and the withdrawal client helper. Browser tests exercise many of those routes and a mocked withdrawal submission. API CommonJS execution is tested through server-focused test files but is not represented as complete backend coverage in the frontend inventory.

Read-only public API probes also confirmed method/auth/validation responses rather than an SPA fallback. Robots, sitemap, and the social-share image returned HTTP 200. No authenticated provider write, test payment, transactional email, webhook replay, monitoring alert injection, or production migration was performed.

## Evidence and next actions

- `production-browser.json`: route, status, final path, heading, canonical, robots, overflow, image, console, and resource observations.
- `production-health.json`: current reported release identity and configuration checks.
- `dependencies.json`: complete npm advisory report and installed dependency paths.
- `production-*.png`: home, store, and contact at desktop/mobile widths.
- Ignored local logs: `unit-tests.log`, `browser-tests.log`, `coverage-inventory.log`.
- Reusable read-only sweep: `react-app/scripts/audit-public-site.mjs`, run from `react-app` with `node scripts/audit-public-site.mjs`. The optional `AUDIT_ORIGIN` selects the origin. Output currently goes to this dated audit folder.

Address the dependency gate first. Then qualify current main on a deployment with the intended public-origin configuration and verify hydrated metadata, CAPTCHA/authentication, and service-mediated portal flows against that exact candidate. Keep commercial ordering disabled until the six missing evidence items are independently completed and approved.
