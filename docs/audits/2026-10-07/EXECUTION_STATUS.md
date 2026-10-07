# Website remediation execution

Started 2026-10-07 on `codex/website-audit-remediation`, based on main `77aead61515245e553efdda15fdaf4973b7e462a`. This document separates implemented changes from deployed and provider evidence.

## Source work

- Implemented shared public-origin validation, private-route metadata, and CSP-compatible static 404 styles.
- Implemented recoverable auth initialization, deferred anonymous public startup, rejected SDK retry, stale-session/staff guards, and timer cleanup. Restored every skipped timer regression.
- Deeper portal tests reproduced and repaired password-form cleanup after asynchronous work, duplicate customer/staff writes, and stale admin summaries after role downgrade.
- Patched the vulnerable source-map-js lockfile resolution; dependency audit now passes.
- Replaced incomplete asset measurement with transitive manifest graphs and separate public, portal, and SDK budgets.
- Verified the published raw benchmark archive and arithmetic; corrected publication links and retained methodological limits.
- Added signed operational Stripe and fulfillment failure markers, protected Preview synthetic triggers, fail-closed log parsing, and durable Redis processing reconciliation. Nine real Redis cases passed in a disposable container. Deployment and a separately provisioned monitoring secret are still required for operational use.
- Added customer and synthetic AAL2 staff browser interactions, ownership denial, metadata navigation, and CSP 404 checks. Responsive staff testing found and fixed the status toolbar overflowing at 320 pixels.
- Implemented consent-gated Vercel Web Analytics. Tracking is restricted to fixed public routes, strips query strings and fragments, and excludes auth/account/admin/checkout routes and custom form events. The installed SDK passes intercepted browser collector tests. Live event ingestion remains unverified until deployment; no dashboard settings were changed.

## Final local verification

- ESLint and whitespace checks pass. The dependency audit reports zero vulnerabilities. Production builds pass configuration validation and secret scanning.
- All 472 unit tests in 52 files pass with no skipped tests. Focused coverage: 91.08% lines and 81.56% branches. Separate source inventory: 90.00% lines and 80.81% branches. These are code coverage measurements, not proof of provider behavior.
- Final browser coverage includes 72 enabled-commerce fixture checks, 14 disabled-commerce checks, and 20 portal/metadata/Analytics checks on desktop and mobile. The initial extended portal run exposed the toolbar defect; `final-portal.log` records the passing correction. The full final rerun is recorded in `final-e2e.log`.
- Customer and staff fixtures cover 320, 390, 768, 1280, and 1440 pixels, including ticket conversations, composition, status, and reply interactions. Provider calls in those browser tests are intercepted synthetic fixtures.
- A separate sweep passed all 100 anonymous route/width combinations, including unknown routes. Computer Use reviewed benchmark link contrast, the 320-pixel store, navigation, and consent controls; saved screenshots accompany this audit. A navigation during the local rebuild briefly encountered a replaced chunk; reloading the finished build restored the page. That local rebuild event is not deployment proof.
- All final transitive asset scenarios pass their unchanged public, portal, and SDK limits. Home is lazy-loaded, and homepage measurements explicitly include its complete graph. See `final-budget.log`.
- Raw benchmark download integrity and capture arithmetic passed. Public links now point to the published archive, with readable contrast and keyboard focus styling. The preliminary, single-PC, whole-configuration limits remain visible.

## Verified provider baseline

- Vercel Production: `dpl_GqvggywWh9SNs1a9hjqYZDCU9weM`, main source `77aead61515245e553efdda15fdaf4973b7e462a`, fingerprint `softhe-77aead6-stage1`.
- Public health passed the original audit. Production ordering/contact submission remain visibly disabled.
- Existing monitoring Preview: `dpl_FS9FAVwQ5gX7EqgVfmiUozKMePUs`, `customer-portal-test`, source `0f151e9a1d5d8f79545880c6e094b84dcd0990d9`; initial health was 503 with portal unavailable, now HTTP 200 after restoration.
- Read-only Vercel configuration confirms this branch's Supabase URL is `https://zbchdxptibehtizomwiq.supabase.co`. Server keys were not decrypted or copied.
- The owner authorized restoring that isolated Supabase project. It is now `ACTIVE_HEALTHY`; the same immutable monitoring Preview now returns HTTP 200 `ready` with every check true. The restoration resolved its portal readiness failure.
- The owner also authorized two temporary synthetic customers and cleanup. Credential-free synthetic identities were exercised inside a rolled-back transaction on the isolated database: own-record access, cross-customer and forged-owner denial, role escalation denial, protected columns, anonymous denial, and suspension all passed. Cleanup returned zero synthetic users, tickets, and orders. See `isolated-rls-result.json` and `test-isolated-rls.sql`. This is live database policy proof, not Auth API or browser/API evidence.
- Historical September synthetic customer accounts were deleted after testing. Existing test inbox/account access and legal/accounting approval records have not been located.
- Production schema metadata shows nine public tables with RLS enabled. Security Advisor still reports leaked-password protection disabled. No production table rows or credentials were read.
- Apex DNS A `216.198.79.1`, TTL 300; authoritative nameservers remain Dynadot. Historical Pages rollback documentation has been marked as history.

## Outstanding verification and decisions

The source changes and local gate are complete. Immutable candidate deployment, real Auth API/browser sign-in and email delivery, provider-backed payment/fulfillment flows, actual notification receipts, and rollback rehearsal remain pending. Vercel CLI authentication is invalid; connected provider tools and the authenticated browser remain available. The database transaction proved ownership policies without creating password credentials or sending mail. No branch push, PR, merge, deployment, production flag change, or new persistent credential/account creation has been performed.

Six commercial evidence entries remain pending: counsel, accounting, Stripe idempotency, asynchronous payment, Stripe webhook alert, and fulfillment alert. Historical evidence remains tied to its original candidate. Commerce activation requires the corresponding evidence and the owner's release decision.
