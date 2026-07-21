# Production readiness status

Last verified: 2026-07-21 (Europe/Berlin)

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
- The current candidate is deployment `dpl_GcYxZonCruvCzdFHThER9QxScWsh`, sourced from
  commit `30dc920f6ba08145c74aa00573ebfdec02374a46`. `/api/health` reports the matching
  public release fingerprint, preventing the project alias from silently changing candidate identity.
- Vercel serves the application and serverless routes with the configured security headers, while contact and commerce remain disabled.
- `/api/health` correctly returns HTTP 503 `configuration-required`. The server-side legal
  identity now validates and the contact, withdrawal, and storage configuration checks pass.
  VAT status is configured as not registered. The remaining missing values are two Stripe values
  and the fulfillment webhook URL and secret. The sole-trader identifier remains server-side and
  must not be added to a public `VITE_` variable or committed documentation.
- Automatic GitHub integration is not connected yet. The authenticated `Softhe` GitHub account
  can push to `gangan668/softhe.io`, and the Vercel GitHub App is now installed on the owner
  account with access restricted to `softhe.io`. However, the Vercel user remains linked to the
  `Softhe` GitHub sign-in identity, so both the dashboard and CLI still reject attaching the
  owner namespace. The generated Preview URL is also protected by Vercel authentication.
- The scheduled production-smoke variables now target the Vercel project domain with application-marker, security-header, and serverless requirements enabled. Run `29802155580` passed the page, header, and true-404 checks, confirmed the expected candidate commit and fingerprint in the health response, then failed on the intentional HTTP 503 configuration gate.
- The scheduled smoke also pins the candidate source commit and public release fingerprint; once
  health is ready, an unexpected alias movement will fail monitoring.

## External launch blockers

- Upstash and EmailJS values are configured for both Vercel Preview and Production. Their
  delivery, retention, and idempotency evidence is still pending.
- EmailJS non-browser API access is enabled, but direct provider tests return HTTP 403 because the
  account uses strict mode and no private key has been configured in Vercel. Do not copy that
  credential or treat template configuration alone as delivery evidence without explicit approval
  and a successful server-origin delivery test.
- Stripe and fulfillment values documented in `DEPLOYMENT.md` are not configured.
- The Vercel GitHub sign-in identity must be switched from `Softhe` to `gangan668`, or an
  explicitly approved token-based GitHub Actions deployment must be configured, if automatic
  pull-request Preview deployments are required.
- Real Swedish operator identity, VAT status, legal/accounting approval, and final benchmark methodology/evidence are still required.
- EmailJS, Upstash, Stripe test mode, withdrawal delivery, fulfillment idempotency/retries, and monitoring alerts require end-to-end evidence in their provider systems.
- DNS promotion, live-commerce enablement, and rollback rehearsal must wait until every item in `COMMERCIAL_LAUNCH_CHECKLIST.md` is evidenced.
- The production smoke workflow now enforces its app-marker, serverless, and security-header requirements against the Vercel candidate; it will stay red until `/api/health` reports ready.
- `docs/launch-evidence.json` remains deliberately pending. Its verifier rejects every
  unevidenced item, so the Commercial Release Gate cannot pass or promote the current candidate.

## Next release action

Populate the Vercel project with verified legal, benchmark, and provider values, enable strict production configuration, and run `npm run smoke:production` with `PRODUCTION_BASE_URL` set to the Vercel origin. Do not move DNS or enable commerce while `/api/health` is unavailable or incomplete.
