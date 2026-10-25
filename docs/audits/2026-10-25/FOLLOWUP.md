# Audit remediation follow-up

Date: 2026-10-25, Europe/Berlin. Branch: `codex/website-audit-followup-2026-10-25`, based on current remote main `7ca108b5ce2a4abde28907cab912a9d520357ba8`.

## 1. Dependency gate repaired locally

Pinned Vite to 7.3.7 and Vitest, UI, and coverage to matching 4.1.12 versions. Updated the transitive Zod lockfile entry to 4.6.6. The full dependency audit now reports zero vulnerabilities. No forced or major-version upgrade was used.

## 2. Metadata repair qualified on existing staged main

The Vercel Production-target deployment `dpl_FBrzme7GnyDjLmpKByrcv6cMcPzn` at
`https://softhe-e4rn8keki-suportsofthe-9420s-projects.vercel.app` is READY and reports exact main source `7ca108b5ce2a4abde28907cab912a9d520357ba8`, fingerprint `softhe-7ca108b-stage1`, HTTP 200 ready, and seven true checks. This existing deployment does not contain this follow-up's dependency, CAPTCHA, or workflow changes.

Authenticated browser qualification passed 40 route/viewport checks at 390px and 1440px. Canonicals use `https://softhe.io`, authentication pages remain `noindex, nofollow`, and anonymous account/admin requests redirect to login. No page exceptions, broken images, or horizontal overflow were found. Sanitized observations are saved as `staged-main-browser.json` and `staged-main-browser-strict-*.json`.

Added `npm run smoke:browser` and its shared deployed-browser checker. It validates initial HTML and hydrated metadata, source/fingerprint when supplied, health, private-route protection, static-404 CSP compatibility, images, layout, and page exceptions. The gate reproduces the public site's canonical regression and passes against the authenticated staged main deployment. The scheduled Production Smoke workflow now includes it after the HTTP smoke. This workflow change is local until publication and merge.

## 3. Production routing inspected, promotion pending

Connected Vercel alias inspection confirms both `softhe.io` and `www.softhe.io` still point to the older deployment `dpl_GqvggywWh9SNs1a9hjqYZDCU9weM`. They were not reassigned. The public API still reports `77aead6`.

The updated source must be published and staged as a fresh exact-commit candidate before promotion. The existing staged main deployment is evidence for the metadata/404 repairs, not proof that this follow-up is deployed. The Vercel connector works; the local Vercel CLI reports logged out. Existing connected access was used without reading or exporting credentials. The public project's protection settings were preserved.

## 4. Technical evidence recovered; legal approvals remain pending

Reconciled four historical technical items in `docs/launch-evidence.json`. The original verification dates and historical scope are retained. GitHub logs and actual Gmail receipts independently establish the two October 8 controlled monitoring notifications. Archived Stripe Sandbox snapshots and the October 9 execution record establish the earlier unpaid-to-paid async event and duplicate replay. The exact-session receipt was independently rechecked in Gmail.

See `HISTORICAL_PROVIDER_EVIDENCE.md` for event/run/message IDs, archive hashes, and limitations. No new payment, webhook replay, or notification was sent. The historical candidate binding in the manifest was preserved. The verifier now rejects only `legal.counsel-approval` and `legal.accounting-approval`. Their actual approvers and approval records are still required, along with candidate-specific qualification before commerce activation.

## 5. Static 404 repair qualified on existing staged main

The deployed-browser gate confirms true HTTP 404, `noindex, nofollow`, and no inline-style CSP violation at both widths on the existing staged main deployment. The public deployment remains affected until a qualified replacement is promoted.

## 6. CAPTCHA failure recovery implemented locally

The authentication UI previously cleared a failed/expired CAPTCHA token without a helpful failure explanation. It now shows an accessible message for failure, expiry, timeout, and unsupported browsers, plus a retry button. Retry resets the widget and clears the token. Submission remains disabled until a new successful token arrives; no CAPTCHA validation was bypassed.

Four added regression cases failed on the previous implementation and pass with the change. They confirm the message, disabled submit, reset, absence of a provider request, and successful re-verification. Existing authentication and CAPTCHA tests remain green.

Real Cloudflare challenges remain unsolved in automated Chromium. Cloudflare documents that automated browsers are detected and recommends dummy keys for automated integration tests. Dummy keys were not installed in production. The immutable staged hostname is not established as an allowed human CAPTCHA hostname; the historical widget record allowed the public domain and stable test alias. Real success/rejection must be tested interactively on an allowed hostname.

The isolated Supabase project is listed as ACTIVE_HEALTHY by project metadata, but advisor calls return hibernation and a bounded read-only SQL check timed out. Its current Auth state is unverified; no restoration, configuration change, or new identity was attempted. Production's sole security-advisor warning is leaked-password protection, covered by the existing scoped September 1 Free-plan risk acceptance. No paid upgrade or security-policy change was made.

## Final local validation

| Check | Result |
| --- | --- |
| Full npm dependency audit | Zero vulnerabilities |
| Lint | Passed |
| Unit tests | 557 passed in 56 files |
| Coverage gate | Passed: 87.50% statements, 81.99% branches, 84.54% functions, 91.62% lines |
| Enabled browser suite | 74 passed |
| Disabled browser suite | 14 passed |
| Portal browser suite | 24 passed |
| Strict fixture builds and client secret scans | Passed in all three modes |
| Asset performance budgets | Passed |
| Disposable database security tests | Passed |
| Benchmark evidence verifier | Passed |
| Deployed-browser gate, existing staged main | 40 passed, exact source/fingerprint |
| Deployed-browser gate, current public site | Correctly fails the hydrated canonical check |
| Launch evidence | Two pending legal/accounting approvals |

No public promotion, commerce/staff enablement, scheduled-monitor activation, DNS change, provider account creation, password entry, payment, or outgoing message was performed. Local code/evidence is ready for review and publication approval. After publication, stage the exact new commit without assigning live domains and repeat both HTTP and browser qualification before requesting promotion of that concrete deployment.

References: [Cloudflare automated testing guidance](https://developers.cloudflare.com/turnstile/troubleshooting/testing/), [existing risk acceptance](../../SECURITY_RISK_ACCEPTANCE_2026-09-01.md).
