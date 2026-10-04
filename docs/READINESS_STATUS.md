# Production readiness status

Last verification checkpoint: 2026-10-04 (Europe/Berlin). The observations below distinguish controlled alert detection, notification receipt, and candidate readiness.

## Verification checkpoint (2026-10-04)

- Chrome verification reconnected successfully. GitHub Actions shows the latest PR #7 quality, CI, E2E, staging artifact, and CodeQL runs passing for `9175262`.
- The monitoring baseline run `37156833933` passed. The replacement Vercel credential works for the controlled test workflow's runtime-log queries.
- Controlled uptime run `37157286776` passed production health, then deliberately failed. The user supplied the corresponding Gmail failure-notification screenshot. Its notification evidence is now recorded as passed in `launch-evidence.json`.
- Fresh controlled browser run `37158143606` detected exactly one browser-error event, zero delivery failures, and zero confirmation-review events. Production health, event emission, and runtime queries passed before the expected alert-evaluation failure. Receipt of this run's notification is not yet verified.
- Controlled delivery run `37158224480` completed after the browser run. Alert evaluation detected one delivery-failure event, one browser-error event still inside the shared log window, and zero confirmation-review events. The expected alert failure confirms detection of the requested delivery event; notification receipt remains unverified.
- Chrome's currently open mailbox returned no matching GitHub monitoring notifications for the last two days. It is a different mailbox from the user-provided uptime receipt. Do not treat this search as proof that the intended notification mailbox failed.
- The immutable candidate `https://softhe-q4r1b6rp2-suportsofthe-9420s-projects.vercel.app/api/health` reports source `91752621910b593f0b8d042a921f73d3a0c5d7df` and fingerprint `softhe-9175262-stage1`, but status is `configuration-required`. Portal, checkout, contact, tickets, withdrawal, storage, and fulfillment readiness checks are all false. This candidate cannot pass strict release smoke without appropriate isolated configuration.
- Subsequent Chrome mailbox inspection verified that the received 00:22 browser-error email links to run `37158143606`. The user followed the received delivery email link to run `37158224480`. All three controlled alert notification proofs are now recorded as passed. The stage-one evidence verifier passes structurally, but the manifest still describes the older September candidate and must be rebound to a freshly qualified deployment before release.
- The manual Commercial Release Gate has a separate `stage_candidate` mode. It builds using the existing Production configuration, forces commerce and staff access off, skips live domain assignment, and verifies runtime readiness and exact source identity. This mode does not run the qualification job or promote the deployment. No Production secrets are copied into Preview.
- Keep commerce and staff access disabled. No merge or production promotion has been performed at this checkpoint.

## Test-branch checkpoint (2026-10-03)

- `copy-rewrite-test` retains checkout idempotency keys after ambiguous server failures, including HTTP 502, while definite client rejections release the key. Regression tests cover the uncertain retry behavior.
- The local suite passes with 321 tests passed and 3 skipped. Coverage is 89.54% lines and 81.37% branches. Both browser profiles pass, with 62 enabled-state and 4 disabled-state checks. The dependency audit reports zero vulnerabilities after the transitive dependency update. These are local checks, not live payment or delivery evidence.
- Vercel deployment metadata shows the Ready Production deployment from `main` at `b36a5a8`, dated 2026-09-22, and the older Preview. No `copy-rewrite-test` deployment was observed. Ready deployment status does not establish provider readiness or verify the public site's behavior.
- Fresh inspection of `https://softhe.io/api/health` returns HTTP 200 `ready`, all configuration checks true, source `b36a5a8`, and fingerprint `softhe-b36a5a8-stage1`. Strict local production smoke passes the application marker, security headers, serverless checks, and exact release identity. Health readiness checks configuration; it does not prove successful payment, fulfillment, or email delivery.
- The scheduled GitHub smoke had stale July identity expectations. Its three non-secret repository variables now target `https://softhe.io`, source `b36a5a8`, and fingerprint `softhe-b36a5a8-stage1`. Fresh smoke run `37148460844` completed successfully. Monitoring failed with `User not found` for its Vercel authentication. No token was modified; credential renewal requires the account owner. No completed monitoring evidence was recorded.
- The stage-one evidence gate still requires three pending alert proofs: uptime, browser-error, and delivery-failure alerts. The full commercial evidence gate has nine pending entries, including those three. Source fixes do not satisfy either gate or authorize commerce activation.
- Preview log queries now use the repository variable `MONITOR_PREVIEW_BRANCH`, with `customer-portal-test` retained as the scheduled-monitoring fallback. Controlled browser and delivery tests require explicit `MONITOR_BASE_URL` and `MONITOR_PREVIEW_BRANCH` variables. Before running them, verify that the protected Preview URL belongs to that branch in Vercel; the workflow checks that both values are configured, but cannot establish their relationship from their strings alone. Update both together when changing the test deployment.
- Keep `COMMERCE_ENABLED`, `VITE_COMMERCE_ENABLED`, and `STAFF_PORTAL_ENABLED` false. Publish the corrected candidate, require green CI, verify the Preview, and collect the stage-one alert evidence before claiming production qualification. Live provider, legal, payment, and fulfillment evidence remains outstanding.

## Test-branch checkpoint (2026-09-28)

- `copy-rewrite-test` contains source changes to the public copy, checkout and webhook retry handling, accessibility, contact form, product links, CSP validation, and development dependencies.
- The local unit suite passes (297 passed, 3 skipped), both browser profiles pass (62 enabled-state and 4 disabled-state checks), the build and secret scan pass, and `npm audit --audit-level=moderate` reports zero vulnerabilities. These checks do not verify live providers or the deployment.
- The checkout webhook now stores separate fulfillment stages. An uncertain EmailJS confirmation attempt is held for manual review because EmailJS does not provide an idempotency key. Operators must investigate `stripe_confirmation_requires_review`; the code cannot guarantee exactly-once delivery by itself.
- The benchmark remains preliminary whole-system evidence, not proof of a particular product's effect. Raw runs and full methodology still need publication. Copy changes do not replace the missing evidence.
- This is a local test-branch checkpoint, not a Production deployment or commercial launch approval. Keep commerce disabled until the evidence gate passes and the live environment has been checked.
- `npm run evidence:verify` still rejects nine pending legal, payment, idempotency, and monitoring evidence items. Their status was not changed by this source update.

## Previous checkpoint (2026-09-15)

### Recorded release checkpoint at that date

- Local `main` and the fetched `origin/main` identify merge commit
  `bbea382223668498f5668c22c9f58ceae1a03b39`. No tracked changes preceded this status update.
- The Vercel project origin, `https://softhe-io.vercel.app`, reports that source commit and
  fingerprint `softhe-bbea382-stage1`. Health remains `configuration-required`: contact,
  tickets, withdrawal, and storage pass; portal, checkout, and fulfillment do not.
- Local lint and unit checks pass: 33 test files, 296 passed tests, and 3 skipped tests.
  These checks do not prove provider behavior or Production readiness.
- `npm run benchmark:verify` passes. `npm run evidence:verify` remains blocked by nine entries:
  legal counsel and accounting approval; Stripe asynchronous payment and Upstash Stripe
  idempotency evidence; uptime, browser-error, delivery-failure, Stripe-webhook, and
  fulfillment alert evidence. Do not mark these passed without provider or human proof.
- The next provider dependency is Stripe test credentials (`STRIPE_SECRET_KEY` and
  `STRIPE_WEBHOOK_SECRET`) plus the actual fulfillment receiver URL and signing secret
  (`ORDER_FULFILLMENT_WEBHOOK_URL` and `ORDER_FULFILLMENT_WEBHOOK_SECRET`). Health failure
  alone does not establish which individual values are absent or invalid; inspect scoped
  provider configuration before changing it.
- On 2026-09-21 the claimed Vercel Stripe integration provisioned a sandbox test secret and
  publishable keys for Production and Preview. The webhook destination and its signing secret
  remain pending until the Production receiver deployment is available.
- `/api/order-fulfillment` is the Production receiver, internally handled by the shared Stripe
  webhook function to stay within the Vercel Hobby function limit. It verifies the sender HMAC, enforces
  the Checkout Session idempotency key, durably deduplicates accepted orders in Upstash, and
  retains the bounded order record for the configured legal period.
- `api/test-fulfillment.js` is explicitly Preview-only. Do not point Production at that
  endpoint or relax its environment guard to make health pass.
- Keep `VITE_COMMERCE_ENABLED`, `COMMERCE_ENABLED`, and `STAFF_PORTAL_ENABLED` false.
  Validate payment, webhook, idempotency, retry, and monitoring behavior before running
  the Commercial Release Gate. This checkpoint does not authorize DNS cutover or live commerce.
- The observations below are historical, not current deployment identity, provider
  verification, or launch approval. Do not copy historical Preview secrets into Production.

## Historical checkpoint (2026-07-21)

## Repository state

- The application remains fail-closed by default: contact and commerce require explicit feature flags plus a configured legal identity.
- Enabled and disabled browser profiles are self-contained. `npm run e2e:all` builds each profile and runs 48 enabled-state plus 4 fail-closed desktop/mobile tests.
- The current local gate passes: dependency audit, lint, the full unit and coverage suites,
  strict builds, browser tests, and the asset budget.
- A committed launch-evidence manifest and manual Commercial Release Gate now bind legal,
  provider, monitoring, benchmark, approval, rollback, deployment-origin, and commit evidence
  to the strict production smoke before promotion.
- The homepage benchmark image now preserves its 969×226 source ratio instead of rendering inside a forced 16:9 frame.
- The production-hardening work is committed on `main`; draft PR #3 contains the final runtime cleanup and status updates on `agent/release-candidate`.

## Live environment

- `https://softhe.io` is served by GitHub Pages and renders successfully on desktop and mobile.
- The live checkout and contact form are disabled.
- `https://softhe.io/api/health` returns 404 because GitHub Pages cannot host the serverless API.
- The live response does not include the Vercel security headers defined in `vercel.json`.
- GitHub Pages is configured as a manual-only legacy rollback workflow. The public site remains on the older Pages deployment until a validated Vercel release is promoted.

## Vercel release candidate

- The `softhe-io` Vercel project and a release-candidate deployment now exist; the stable project domain is `https://softhe-io.vercel.app` and the custom production domain has not moved.
- The current candidate is deployment `dpl_EXmsJm8uNKmexoAXpKtrm5cMMRfg`, sourced from
  commit `30dc920f6ba08145c74aa00573ebfdec02374a46`. `/api/health` reports the matching
  public release fingerprint, preventing the project alias from silently changing candidate identity.
- Vercel serves the application and serverless routes with the configured security headers, while contact and commerce remain disabled.
- `/api/health` correctly returns HTTP 503 `configuration-required`. The server-side legal
  identity now validates and the contact, withdrawal, and storage configuration checks pass.
  VAT status is configured as not registered. The remaining missing values are two Stripe values
  and the fulfillment webhook URL and secret. The sole-trader identifier remains server-side and
  must not be added to a public `VITE_` variable or committed documentation.
- Automatic GitHub integration is connected to `gangan668/softhe.io`. The Vercel GitHub App is
  installed on the owner account with access restricted to `softhe.io`, the Vercel GitHub
  sign-in identity is `gangan668`, and both the dashboard and CLI confirm the project link.
  Commit `81bbafedfd0d0a44232d406c7bf3b05d1fc1a02c` automatically produced Ready Preview
  deployment `dpl_Ech2JZZLv5qjJgR1A96qcd7pUphs`, proving the Git trigger and source attribution.
  The generated Preview URL remains protected by Vercel authentication.
- Provider secrets remain scoped to Production. The first Git Preview therefore returns the
  expected fail-closed HTTP 503 with EmailJS and Upstash listed as missing; Production secrets
  are not copied into pull-request deployments merely to make Preview health appear ready.
- The scheduled production-smoke variables now target the Vercel project domain with application-marker, security-header, and serverless requirements enabled. Run `29802155580` passed the page, header, and true-404 checks, confirmed the expected candidate commit and fingerprint in the health response, then failed on the intentional HTTP 503 configuration gate.
- The scheduled smoke also pins the candidate source commit and public release fingerprint; once
  health is ready, an unexpected alias movement will fail monitoring.

## External launch blockers

- Upstash and EmailJS provider credentials are scoped to Vercel Production. Contact rate limiting,
  withdrawal retention, and withdrawal idempotency have production evidence. Stripe idempotency
  remains pending until Stripe test credentials are configured.
- EmailJS non-browser API access and strict mode are enabled. The EmailJS key pair was rotated,
  the new private key was stored as a sensitive Production-only Vercel variable, and the previous
  key was revoked. The Gmail service authorization was also renewed with the explicit send scope.
  Direct contact and order-template provider requests returned HTTP 200. Server-origin production
  tests proved contact delivery and its HTTP 429 rate limit, withdrawal acknowledgement plus
  operator notification, duplicate suppression, and a retained Upstash record with the intended
  roughly 400-day TTL. No credential values are stored in the repository or evidence documents.
- Stripe and fulfillment values documented in `DEPLOYMENT.md` are not configured.
- The Swedish operator identity and non-VAT status are configured. Legal/accounting approval and
  final benchmark methodology/evidence are still required.
- Stripe test mode, Stripe idempotency, fulfillment idempotency/retries, and monitoring alerts
  require end-to-end evidence in their provider systems.
- DNS promotion, live-commerce enablement, and rollback rehearsal must wait until every item in `COMMERCIAL_LAUNCH_CHECKLIST.md` is evidenced.
- The production smoke workflow now enforces its app-marker, serverless, and security-header requirements against the Vercel candidate; it will stay red until `/api/health` reports ready.
- `docs/launch-evidence.json` remains deliberately pending. Its verifier rejects every
  unevidenced item, so the Commercial Release Gate cannot pass or promote the current candidate.

## Next release action

Configure and verify the two Stripe values plus the fulfillment webhook URL and secret, then collect
the remaining legal, benchmark, withdrawal, retention, monitoring, and rollback evidence. Run
`npm run smoke:production` with `PRODUCTION_BASE_URL` set to the Vercel origin. Do not move DNS or
enable commerce while `/api/health` remains incomplete.
