# Commercial launch checklist

This checklist is intentionally fail-closed. Check an item only when evidence exists in the named system. Live commerce remains disabled until every **Launch blocker** is complete.

Record the evidence for every item in [`launch-evidence.json`](launch-evidence.json). The file
deliberately starts with pending entries and the manual **Commercial Release Gate** workflow
rejects missing, placeholder, stale-candidate, or unapproved evidence before it runs the strict
production smoke. The manifest identifies the deployed source commit and public release fingerprint
rather than the later commit that records its evidence. The strict smoke confirms both through
`/api/health`. Validate it locally from `react-app` with `npm run evidence:verify`.

## Launch blockers

- [x] Vercel Preview has all server and client variables configured and `VITE_REQUIRE_PRODUCTION_CONFIG=true`.
- [x] `GET /api/health` returns HTTP 200 with `status: ready` and all checks true.
- [x] Registered Swedish operator name, sole-trader identifier, postal address, jurisdiction, VAT status, and support contact are configured.
- [ ] Swedish counsel/accounting approved the Legal Notice, Privacy Policy, Terms, withdrawal flow, checkout consent, price/VAT presentation, and receipts.
- [x] EmailJS contact, order, withdrawal acknowledgement, and operator-notification templates delivered successfully.
- [ ] Upstash contains rate-limit, Stripe idempotency, and withdrawal request records with the intended retention.
- [ ] Stripe test order completed, including a duplicated webhook and an asynchronous-payment event.
- [ ] The fulfillment receiver accepted, deduplicated, retried, and reconciled the test order.
- [ ] Order confirmation includes items, total/currency and VAT treatment, terms, withdrawal link, support, and fulfillment status.
- [ ] `npm run lint`, coverage, strict build, asset budget, isolated desktop/mobile E2E, dependency audit, and production smoke all pass.
- [ ] Security headers, route metadata, browser console, and true 404 behavior were manually reviewed on Preview.
- [ ] Uptime, browser error, contact/withdrawal delivery, Stripe webhook, and fulfillment alerts were triggered in a test.
- [ ] Last known-good Vercel deployment and DNS rollback instructions are recorded for the release.
- [ ] The Commercial Release Gate passes for the deployment origin, source commit, and release fingerprint being promoted.

## Evidence quality

- [ ] Benchmark page names the exact hardware, BIOS, drivers, Windows/game versions, settings, and capture date.
- [x] Stock and optimized results use at least two repeated runs and report medians, FPS, and 1% lows.
- [ ] Raw screenshots are published and claims are limited to the documented test configuration.
- [ ] Layouts are approved at 320, 390, 768, 1280, and 1440 pixels.

## Promotion

- [ ] Contact is enabled only after its independent delivery, privacy, rate-limit, spam, and failure-message checks pass.
- [ ] `VITE_COMMERCE_ENABLED=true` is applied only after every launch blocker above is complete.
- [ ] Production smoke passes immediately after DNS cutover.
- [ ] GitHub Pages automatic deployment remains retired.
