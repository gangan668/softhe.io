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

### Medium — Leaked-password protection unavailable on current plan (open)

- **Boundary:** Supabase Auth signup and password changes.
- **Evidence:** Supabase Security Advisor reports `auth_leaked_password_protection`. Enabling the control in the disposable project was rejected because HaveIBeenPwned protection requires Pro.
- **Remediation:** Upgrade the organization/project to Pro and enable **Prevent use of leaked passwords**, then verify a known compromised password is rejected. Do not infer this protection from client-side password-strength checks.
- **Verification:** Open; this prevents a claim of zero unresolved Supabase security warnings.
- **Reference:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### Low — Missing privileged-audit actor index (fixed)

- **Boundary:** Audit lookup performance and advisor findings.
- **Remediation:** Added `staff_audit_events_actor_id_idx`.
- **Verification:** Index exists. Fresh-project performance advisor reports only informational unused-index notices; no index was removed without workload evidence.

## Isolation evidence

- Synthetic customer A and B could read only their own profiles.
- Cross-customer ticket reads returned no rows.
- Cross-customer message insert, role manipulation, ticket deletion, and closed-ticket writes were denied.
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
- Supabase Security Advisor: one unresolved warning for leaked-password protection.
- CodeRabbit: unavailable because its installer rejects this Windows/MINGW environment; no CodeRabbit result is claimed.

## Release status

Production promotion and commerce remain blocked. The branch-scoped isolated Preview, low-rate live API probing, current commit/evidence binding, final secret repair, and disposable-project cleanup must complete before this run can be accepted. Hardening changes must remain on `customer-portal-test` until review; do not merge or promote automatically.
