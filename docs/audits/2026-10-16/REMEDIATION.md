# Audit remediation and rollout

This follows the initial findings in REPORT.md. The source changes include the initial audit repairs and the subsequent improvements requested by the owner. Validation was repeated after the interrupted session; no earlier test result alone establishes the final candidate's status.

## Implemented behavior

- Ticket create/reply requests use the authenticated API, Redis rate limits and idempotency, and atomic service-only database functions. The API binds the actor to the verified user. The database rechecks active status, ownership, closed status, and input bounds under row locks.
- Three ordered migrations separate compatible column restrictions, additive service RPC installation, and final direct-browser-write revocation. The last phase must follow deployment of the new API. Database constraints now match the API's accepted 160-character subjects and 5000-character messages.
- A pinned PostgreSQL WASM dependency runs executable database authorization regressions in CI. These cover service operations and denial of direct writes, cross-customer replies, closed-ticket replies, suspended accounts, and invalid input.
- Every API export uses a small native Node HTTP adapter. Vercel's automatic request helpers are disabled at build and runtime through versioned deployment configuration. JSON requests are limited while streaming before JSON.parse, including chunked and multibyte bodies. Checkout allows 32 KiB; other JSON handlers allow 16 KiB. Stripe and fulfillment signature verification retain raw bytes. Native HTTP tests exercise the adapter and exported endpoints.
- Google Analytics is retired, including script initialization and explicit CSP allowances. Existing legacy helpers are inert. Consented Vercel Analytics filters every event against the current consent and public-route allowlist. URL queries/fragments are excluded. FAQ metadata no longer includes free-text queries.
- Browser regressions exercise cross-tab account changes, MFA secret removal, support-draft isolation, delayed staff sends, private navigation, and consent withdrawal after the collector loads. Same-user token refresh now preserves pending account loads and MFA completion while identity changes still discard sensitive state.
- External GitHub Actions are pinned to verified immutable commits. Dependabot proposes reviewed updates, and CI rejects mutable action references. Workflow permissions default to read-only where appropriate.

## Final local validation

The final candidate passed 56 Vitest files and 544 tests with coverage thresholds satisfied: 87.16% statements, 81.61% branches, 84.00% functions, and 91.33% lines in the configured scope. Playwright passed 110 desktop/mobile checks: 72 enabled, 14 disabled, and 24 portal checks. All three builds passed production configuration validation and output secret scanning. Lint, immutable workflow pin checks, executable database tests, benchmark validation, performance budgets, and whitespace checks passed. The installed dependency audit reported zero known vulnerabilities. Independent sub-agent review found no blocker in the native HTTP adapter or ticket-service authorization changes.

The isolated provider qualification now rejects successful direct browser table inserts or legacy RPC calls and verifies a nonempty authorized staff queue. These are executable future hosted gates, with local failure regressions; no new live provider qualification was claimed.

## Hosted database checkpoint

The column restriction and additive service-function migrations were applied successfully to both `mbwsmyqofkxmxkelqviy` and isolated project `zbchdxptibehtizomwiq`. Hosted catalog inspection preceded changes. The old constraints were 120-character subjects and 4000-character messages; the additive limits broaden those bounds. Service-role table permissions were verified.

Both projects passed rolled-back tests for compatible customer invoker RPCs, protected-column denial, service create/reply, cross-customer denial, closed-ticket denial, suspended-account denial, and invalid input. Cleanup queries returned zero synthetic audit users. No permanent Auth accounts or credentials were created.

The enforcement migration has deliberately not been applied to either hosted project. The public domain was verified on source `77aead61515245e553efdda15fdaf4973b7e462a`, deployment `dpl_GqvggywWh9SNs1a9hjqYZDCU9weM`. Revoking old writes before that API is replaced would break its ticket operations. Pushing source to main does not establish that the domain serves the new API.

Follow the deployment order and exact verification queries in `supabase/tests/README.md`. After confirming the new API on the target deployment, apply the enforcement migration and run the post-enforcement regression and catalog checks. Rolling back to the old API after enforcement requires a coordinated permissions rollback; prefer a forward fix.

## Remaining external requirements

Supabase security advisors report leaked-password protection disabled on both projects, with no other security notice returned at this checkpoint. Supabase documents this feature as available on Pro and above: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . The available connector cannot change Auth configuration. No subscription or billing change was made.

The Vercel active firewall configuration lookup returned `Seawall Config not found`. No replacement firewall configuration was created or published. The bounded native reader supplies application-side pre-parse limits; it does not claim to prevent all platform buffering or replace DDoS protection. Runtime behavior on an actual new Vercel deployment still needs qualification.

The commercial evidence gate retains six pending items: counsel approval, accounting approval, Stripe idempotency proof, asynchronous payment proof, Stripe webhook alert delivery, and fulfillment alert delivery. Existing isolated qualification workflows remain available, but no paid requests, inbox sends, legal approvals, or notification receipts were fabricated during this remediation. Commerce activation and live-domain promotion are separate from the requested source push.
