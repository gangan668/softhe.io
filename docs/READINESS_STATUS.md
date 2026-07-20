# Production readiness status

Last verified: 2026-07-20 (Europe/Berlin)

## Repository state

- The application remains fail-closed by default: contact and commerce require explicit feature flags plus a configured legal identity.
- Enabled and disabled browser profiles are self-contained. `npm run e2e:all` builds each profile and runs 48 enabled-state plus 4 fail-closed desktop/mobile tests.
- The current local gate passes: dependency audit, lint, 233 unit tests, coverage, strict builds, browser tests, and the asset budget.
- The homepage benchmark image now preserves its 969×226 source ratio instead of rendering inside a forced 16:9 frame.
- The production-hardening work is committed on `main`; the next repository action is to publish and review a release candidate containing the final runtime cleanup and status updates.

## Live environment

- `https://softhe.io` is served by GitHub Pages and renders successfully on desktop and mobile.
- The live checkout and contact form are disabled.
- `https://softhe.io/api/health` returns 404 because GitHub Pages cannot host the serverless API.
- The live response does not include the Vercel security headers defined in `vercel.json`.
- GitHub Pages is configured as a manual-only legacy rollback workflow. The public site remains on the older Pages deployment until a validated Vercel release is promoted.

## External launch blockers

- No Vercel CLI, local Vercel project link, or Vercel/provider credentials are available in this checkout.
- A Vercel Preview must be created and populated with the server and client variables documented in `DEPLOYMENT.md`.
- Real Swedish operator identity, VAT status, legal/accounting approval, and final benchmark methodology/evidence are still required.
- EmailJS, Upstash, Stripe test mode, withdrawal delivery, fulfillment idempotency/retries, and monitoring alerts require end-to-end evidence in their provider systems.
- DNS promotion, live-commerce enablement, and rollback rehearsal must wait until every item in `COMMERCIAL_LAUNCH_CHECKLIST.md` is evidenced.
- The production smoke workflow keeps its app-marker, serverless, and security-header requirements disabled while the public host is GitHub Pages; set all three requirement variables to `true` for Vercel Preview validation and at cutover.

## Next release action

Publish and review the release candidate, connect it to a Vercel Preview, and run `npm run smoke:production` with `PRODUCTION_BASE_URL` set to the Preview origin. Do not move DNS or enable commerce while `/api/health` is unavailable or incomplete.
