# Ticket write security verification

Run `npm run test:database` from `react-app` to replay repository migrations in an
in-memory PostgreSQL database with a synthetic Auth schema. The pinned PGlite
dependency comes from the normal `npm ci` installation. This checks PostgreSQL
grants, ownership checks, input validation, and the atomic ticket RPCs without
credentials or network calls. It does not verify hosted Auth or deployed state.

The runner checks column hardening before the service migration, then verifies
service-only writes after all migrations. The SQL tests roll back their synthetic
records. Run the individual SQL tests only against a disposable database with
`psql -v ON_ERROR_STOP=1 -f <test-file>`.

## Deployment order

Before applying changes, run `ticket_write_preflight.sql`. It returns existing
check constraints, aggregate counts outside the new limits, service-role grants,
RLS bypass status, and service RPC signatures in one JSON result. Require zero
out-of-range rows. Confirm that the named constraints are the expected length
checks and that replacing them only broadens the permitted ranges. Stop if the
hosted schema has different constraints or RPC signatures. Service RPC execution
requires public schema usage, profile SELECT and UPDATE for row locking, ticket
SELECT/INSERT/UPDATE, message INSERT, activity INSERT, activity sequence usage,
and the service role's RLS bypass. Existing additional checks remain in effect.

1. Apply `20261016005558_restrict_customer_insert_columns.sql`. The old API's
   customer invoker RPCs remain compatible.
2. Apply `20261016011336_mediate_customer_ticket_writes.sql`. This installs the
   service-only create/reply RPCs and aligns database limits with the API's
   160-character subject and 5000-character message limits. It retains old writes.
3. Run `customer_service_rpc.sql` to test the additive RPCs in a rolled-back
   transaction. It creates exactly two temporary synthetic users. Run
   `ticket_write_catalog.sql` to inspect grants without reading customer records.
4. Deploy the API version that calls `create_ticket_for_user` and
   `add_ticket_message_for_user`, then verify an authorized create/reply flow.
5. Apply `20261016011448_enforce_customer_ticket_api.sql` only after that API
   version is confirmed. It revokes direct customer INSERT, column INSERT,
   sequence usage, and old customer RPC execution. Run `customer_service_writes.sql`
   and inspect the catalog again to verify enforcement.

Applying enforcement before the new API is deployed breaks the old API's ticket
writes. After enforcement, rolling the API back to the old invoker implementation
also breaks writes. Prefer a forward fix using the service-only RPCs.
