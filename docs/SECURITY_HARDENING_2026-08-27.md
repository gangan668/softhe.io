# Customer Portal Security Hardening — 2026-08-27

## Scope and safety boundary

Assessment target: disposable Supabase project `zbchdxptibehtizomwiq` and a branch-scoped Vercel Preview for `customer-portal-test`. Production data, production deployment, commerce, credential stuffing, denial-of-service testing, broad scanning, and destructive SQL were excluded.

The Supabase development-branch path was attempted after cost confirmation, but the organization requires a Pro plan for branching. With approval, the assessment used a separate free disposable project instead.

## Findings

### Medium — Excessive browser database privileges (fixed)

- **Boundary:** `anon` and `authenticated` PostgREST roles.
- **Evidence:** The previous grants included operations unnecessary for the portal, including broad table and sequence privileges.
- **Remediation:** `20260827152811_least_privilege_portal_grants.sql` revokes broad privileges and restores only required table, column, and sequence access.
- **Regression:** `databaseSecurity.test.js` validates the grant model and service-only tables.
- **Verification:** Live grant inventory on the disposable project showed no public table access for `anon` and only the required ownership-scoped operations for `authenticated`.

### Medium — Privileged mutation origin checks were incomplete (fixed)

- **Boundary:** Ticket, bootstrap, notification, and staff mutation APIs.
- **Evidence:** Mutating endpoints did not consistently require a same-origin `Origin` and `Host` pair.
- **Remediation:** Added fail-closed HTTP(S) same-origin validation before privileged mutations.
- **Regression:** Server infrastructure tests cover missing and hostile origins.
- **Verification:** Unit and E2E suites pass.

### Medium — Duplicate ticket and staff writes were replayable (fixed)

- **Boundary:** Customer ticket writes and staff replies/status/grant/revoke operations.
- **Evidence:** Repeated submission before the first request completed could create duplicate records.
- **Remediation:** Added UUID idempotency keys in clients plus Redis-backed result caching and in-flight locks on server mutations. Submission controls are disabled while a staff reply is pending.
- **Regression:** Portal, staff-client, and server idempotency tests cover replay behavior.
- **Verification:** Unit suite passes with 295 passed and 3 skipped.

### Medium — Staff revocation auditing was not transactional (fixed)

- **Boundary:** Staff role revocation, session invalidation, and privileged audit trail.
- **Evidence:** The database function revoked access and sessions, while a later server call wrote the privileged audit event; failures could leave revocation without the required staff audit record.
- **Remediation:** `20260827160512_transactional_staff_revocation_audit.sql` writes customer and privileged audit events and deletes sessions in the same database transaction.
- **Regression:** Live synthetic grant/revoke test.
- **Verification:** Role revoked, session deleted, and `staff.revoked` audit event present.

### Medium — Leaked-password protection unavailable on current plan (accepted residual risk)

- **Boundary:** Supabase Auth signup and password changes.
- **Evidence:** Supabase Security Advisor reports `auth_leaked_password_protection`. Enabling the control in the disposable project was rejected because HaveIBeenPwned protection requires Pro.
- **Compensating controls:** The application enforces a 12-character mixed-class password policy, mandatory email verification, Turnstile, generic authentication errors, provider rate limits, recent-authentication checks for password changes, and session revocation.
- **Decision:** On 2026-09-01, the project owner explicitly selected the documented residual-risk alternative instead of authorizing a paid Supabase Pro upgrade. This acceptance applies only to the leaked-password lookup and does not waive any other security or release gate.
- **Future remediation:** Upgrade the organization/project to Pro, enable **Prevent use of leaked passwords**, and verify a known compromised password is rejected. Do not infer this protection from client-side password-strength checks.
- **Verification:** Risk accepted with the compensating controls above; the Supabase advisor warning may remain visible on the Free plan.
- **Reference:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### Low — Missing privileged-audit actor index (fixed)

- **Boundary:** Audit lookup performance and advisor findings.
- **Remediation:** Added `staff_audit_events_actor_id_idx`.
- **Verification:** Index exists. Fresh-project performance advisor reports only informational unused-index notices; no index was removed without workload evidence.

## Isolation evidence

- On 2026-09-01, two newly created, confirmed synthetic customers authenticated through the isolated Supabase project and exercised protected APIs on immutable Preview `dpl_CgkyGn7bAiuGuXMY3pVsLzbbFyUX` (`c02e2fdd1c45a9aacd61a2350f7f6b8e0b02a39c`).
- Each customer could read exactly one own profile and zero rows for the other profile.
- Each customer created one ticket through `/api/ticket-write`, could read its own ticket, and received zero rows for the other customer's ticket, messages, orders, activity, and role.
- Forged ownership and role-escalation inserts were denied with HTTP 403. A cross-customer ticket reply was denied with HTTP 403.
- Replaying one own-ticket reply with the same idempotency key returned HTTP 200 with `duplicate: true` after the original HTTP 201 response.
- Portal bootstrap returned HTTP 200 for both confirmed customers; malformed and stale sessions returned HTTP 401. Direct use of the logged-out token was rejected.
- Staff status returned HTTP 404 with and without a customer token because the staff feature remained disabled.
- Sanitized customer-ID hashes used to correlate the run: `3c946d93c931d87d` and `0cc18ade2fd56241`. No email address, password, token, message body, or service credential was retained.
- Earlier database-only verification also denied cross-customer message insert, ticket deletion, and closed-ticket writes.
- Suspended-user portal reads returned no rows.
- Staff access required `aal2`; `aal1` returned no authorization.
- Staff revocation persisted, removed the synthetic session, and generated the privileged audit event.

## Verification summary

- Unit: 295 passed, 3 skipped.
- E2E: 62 enabled-state tests and 4 fail-closed tests passed across desktop/mobile coverage.
- Lint: passed.
- Coverage: 86.68% statements, 81.02% branches, 90.79% functions, 89.42% lines.
- Dependency audit: zero high-severity vulnerabilities.
- Secret scan: passed.
- Production build: passed.
- Supabase Security Advisor: leaked-password protection remains unavailable on Free and is explicitly accepted as a scoped residual risk.
- CodeRabbit: unavailable because its installer rejects this Windows/MINGW environment; no CodeRabbit result is claimed.
- Independent hosted review: GitHub CodeQL (`security-extended`) is configured for `customer-portal-test`, pull requests to `main`, and `main`; its completed run is required before merge.

## Release status

On 2026-09-01, the branch-scoped service-role secret was repaired and deployment
`dpl_3H7f8TTMdGPrt9Bkb6RDANjqGQEE` became Ready from commit
`980d65f0491d1f711541dfcde5aa3cc568684954`. `/api/health` returned `ready` with the
matching fingerprint `softhe-980d65f-stage1`. Low-rate unauthenticated probing confirmed that staff
access fails closed with 404 and a hostile-origin ticket mutation fails with 403. The Preview CSP now
permits only the exact production and isolated Supabase project origins; wildcard Supabase access is
not allowed.

Production promotion and commerce remain blocked. The authenticated Preview isolation pass and
leaked-password protection decision are complete. Independent CodeQL evidence and disposable-project
cleanup must complete before this run can be accepted. Hardening changes must remain on
`customer-portal-test` until review; do not merge or promote automatically.
