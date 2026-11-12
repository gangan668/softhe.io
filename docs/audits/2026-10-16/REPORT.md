# Security and correctness audit

Date: 2026-10-16, Europe/Berlin. Baseline: `65aa6641945ef8200cb0326b85d64ff0dccce570`. The checkout was clean before this audit. Changes described here are local and have not been deployed.

## Scope and method

Three sub-agents reviewed API security/correctness, frontend authentication/state/privacy, and database permissions/deployment configuration. The primary agent independently inspected the repairs, replayed database regressions, and ran repository validation. The review covered all 27 API JavaScript files, frontend authentication and protected routes, customer/staff support flows, checkout and fulfillment, analytics/monitoring, Supabase migrations/RLS/grants, workflows, and Vercel configuration.

This is a source review with local execution, not a guarantee that all vulnerabilities have been found. Provider tests use mocks or synthetic fixtures. Existing production credentials and configuration were not modified.

## Confirmed findings and repairs

| Priority | Finding | Repair and regression evidence |
| --- | --- | --- |
| High | Authenticated database clients could supply ticket status/IDs/timestamps, message timestamps, and activity metadata/timestamps through table-wide INSERT privileges. Ownership RLS does not protect columns. Older column-level ticket UPDATE grants also survived table-level revocation. | New migration restricts INSERT to the columns used by invoker RPCs and explicitly revokes the legacy UPDATE grants. All migrations replay successfully; customer create/reply works; six protected-column inserts fail. Omitting the migration reproduces a customer-created closed ticket. |
| High | Account changes could retain MFA QR secrets/codes and unsent support data from the previous identity. | Account and Admin session components remount on authenticated user ID changes. Tests cover identity changes with sensitive state. Existing ProtectedRoute checks guarantee a user before these components render. |
| Medium | Analytics and browser error reporting could include authentication query strings/fragments in URLs. Application GA tracking also allowed private routes. | Shared public analytics route allowlist, sanitized URL fields, cleared analytics referrers, and disabled automatic GA page views. Monitoring strips query/hash. Regression fixtures contain synthetic recovery/session tokens and verify they are absent. |
| Medium | Staff queue crashed for nonempty results because passing `UUID.test` as a callback lost its RegExp receiver. | Explicit callback preserves the receiver. Regression exercises authorized queue retrieval and owner lookup. |
| Medium | Portal JSON size limits trusted Content-Length, allowing omitted/understated headers to bypass the guard. Buffered fulfillment payloads bypassed the existing stream cap. | Measure serialized body UTF-8 bytes, validate length and exact JSON media type, and cap buffered fulfillment bodies at 64 KiB. Tests include multibyte and understated-length requests. This guard runs after platform parsing and does not replace edge-level request limits. |
| Medium | Malformed Stripe signatures containing multibyte characters could throw in timingSafeEqual before normal handler error handling. | Require a string header and exactly 64 lowercase hexadecimal signature characters. Malformed signatures reject without throwing. |
| Low | Server product lookup accepted inherited property names or coerced array IDs. | Require a string and an own catalog property. Tests reject constructor, __proto__, toString, and array IDs. Successful underpayment was not demonstrated. |
| Low | Contact, withdrawal, and browser-error endpoints threw on JSON null before validation. | Null-safe normalization returns 400 without outbound calls. |
| Medium | Ticket reply drafts survived conversation switches, and an older staff send completion could clear a newer draft. | Clear drafts when changing tickets and scope completion updates to the initiating conversation. Deferred-response regressions cover the race. |

## Validation

- ESLint passed.
- Final full Vitest run after the last regressions passed 53 files and 506 tests.
- Full Vitest coverage run passed 53 files and 504 tests. Reported coverage: 87.20% statements, 82.10% branches, 85.01% functions, 91.17% lines. These are the configured coverage scope, not a claim that every API branch is instrumented.
- Final Playwright run passed 106 checks: 72 enabled-commerce fixture checks, 14 disabled-state checks, and 20 portal fixture checks across desktop/mobile Chromium. All three builds passed client/server configuration validators and output secret scanning.
- npm audit reported zero known vulnerabilities for the lockfile at audit time.
- Client output secret scan, benchmark evidence validation, all performance budget scenarios, and git diff whitespace checks passed.
- Independent PostgreSQL WASM replay passed using temporary pinned `@electric-sql/pglite@0.3.14`, a synthetic Auth schema, and every repository migration. Reproduce with `PGLITE_MODULE` pointing to the package's absolute `dist/index.js`, then run `node supabase/tests/run-customer-security.mjs`. The SQL regression is also available for a disposable migrated Supabase database.

## Remaining verification and limitations

The database migration must be applied through the normal deployment process before hosted permissions change. The PostgreSQL fixture does not establish hosted Auth behavior or current deployed grants.

Invoker customer RPCs intentionally require ownership-scoped table INSERT privileges. Consequently, direct authenticated database writes can bypass API endpoint rate limiting and omit the multi-write RPC sequence. The column fix prevents the demonstrated protected-column forgery; it does not establish exclusive API mediation or a global database write quota. A future change to exclusive server-mediated writes requires an explicit compatibility review of the customer RPC design.

Google Analytics provider-side enhanced-measurement configuration was not inspected. The application suppresses its own private-route tracking. Existing consented FAQ free-text search analytics remain unchanged.

Workflow action version tags remain a supply-chain hardening opportunity. No additional confirmed exploit was established in the reviewed workflow/Vercel configuration.

Native Computer Use initialized and selected a dedicated Firefox tab, but the tool blocked navigation because browser URL-policy enforcement is unsupported for that Windows browser. Native UI actions stopped at that point. The automated Chromium results above are separate evidence and do not represent completed native Firefox verification.

The commercial evidence verifier still rejects six pending entries: legal counsel approval, accounting approval, Stripe idempotency records, asynchronous payment events, Stripe webhook alert delivery, and fulfillment alert delivery. No evidence status was changed. Live payment, email, monitoring delivery, commercial approval, hosted database state, and production deployment identity were not requalified by this local audit.

No code was pushed, no application was deployed, no hosted database migration was applied, and commerce was not enabled.
