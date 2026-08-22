# Staged production runbook

## Current release candidate

- Source commit: `41e2fe3e970525736eaf0c2b7ae527dec7cc663b`
- Preview deployment: `dpl_8MFq5sHiffXVxzj2XjcohZHN3bo9`
- Preview origin: `https://softhe-ktmr04yr8-suportsofthe-9420s-projects.vercel.app`
- Release fingerprint: `softhe-41e2fe3-stage1`
- Stage-one flags: portal enabled, contact enabled, CAPTCHA enabled, commerce disabled, staff disabled
- Health status: verified HTTP 200 `ready` on 2026-08-22 with every required check true and exact
  source-commit/fingerprint binding.
- Promotion status: blocked only on the pending monitoring-alert proofs and authoritative DNS export
  listed in `docs/launch-evidence.json`. Production and DNS remain unchanged.

Do not promote a different deployment or rebuild from a different commit. Confirm the source commit
and fingerprint through `/api/health` immediately before and after promotion.

## Promotion gate

Promotion is blocked until all of the following are true:

1. The protected Preview is visually reviewed at 320, 390, 768, 1280, and 1440 pixels.
2. Authentication CAPTCHA success and rejection paths are verified against Supabase.
3. A healthy production rollback deployment is identified and rehearsed.
4. DNS records for `softhe.io` are exported from the actual DNS provider. The domain is not managed
   by the Vercel scope currently linked to this repository.
5. Release and rollback owners are named in `launch-evidence.json`.

## Stage-one verification

With commerce disabled, verify the homepage, Services, Store, Performance, Contact, Login, Account,
legal pages, withdrawal page, and a true 404. Confirm that unauthenticated portal bootstrap requests
return 401, the browser console is clean, cookies do not block scrolling, and `/api/health` is ready.

## Rollback procedure

1. Stop promotion if the post-deploy health or browser smoke fails.
2. Reassign the production aliases to the recorded known-good deployment using Vercel's Promote or
   Rollback action. Do not use the current `dpl_6fRyLm6vExfFCnTXLjuuJskGsGPL` deployment as the
   known-good target: on 2026-08-13 its health endpoint returned 503 because Stripe and fulfillment
   configuration was missing.
3. If the failure is at the custom domain or DNS layer, restore the exported records at the actual DNS
   provider.
4. Verify `/api/health`, the homepage, login, contact, security headers, and true 404 behavior.
5. Record the rollback deployment, operator, timestamps, reason, and verification output.

## Commerce activation

Commerce remains disabled until legal/accounting approval, Stripe idempotency and webhook scenarios,
fulfillment acceptance/retry/reconciliation, customer email contents, monitoring alerts, and the
Commercial Release Gate all pass. Enable commerce only through the production environment flag and
run an immediate payment smoke after deployment.
