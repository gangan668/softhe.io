# Customer portal setup

The customer portal uses Supabase Auth and Postgres. Passwords are handled only by Supabase Auth; Softhe.io stores profiles, orders, tickets, and activity records.

## Provisioning

1. Create a Supabase project in the EU region appropriate for the business.
2. Run `supabase/migrations/202607220001_customer_portal.sql` in the Supabase SQL editor or with the Supabase CLI.
3. Enable email/password authentication and require email confirmation. Add `https://softhe.io/login` and `https://softhe.io/reset-password` plus the preview equivalents to the allowed redirect URLs.
4. Add the browser variables from `react-app/.env.example` and server variables from `.env.example` to the matching Vercel environments.
5. Create an EmailJS ticket template using `to_email`, `customer_name`, `ticket_id`, `ticket_subject`, `ticket_status`, and `reply_preview`; set its ID as `EMAILJS_TICKET_TEMPLATE_ID`.
6. Keep the exact Production and Preview Supabase HTTPS and WSS origins in the `vercel.json` Content-Security-Policy. Wildcards are rejected by the deployment header test.
7. Apply the Auth settings below in the Supabase dashboard (Authentication → Providers, Sign In / Up, and Multi-Factor).

## Required Supabase Auth settings (free plan)

These settings are enforced by Supabase, not by browser code. Each one is available on the free plan.

| Setting | Value | Why |
|---|---|---|
| Email provider → Confirm email | On | Checkout and staff checks require `email_confirmed_at`. |
| Email provider → Secure email change | On | Both the old and new address must confirm a change. |
| Email provider → Secure password change | On | Supabase requires the emailed reauthentication code for password changes from sessions older than 24 hours. Sessions created in the last 24 hours are exempt. |
| Require current password when changing password | On, after the Preview check in the rollout handoff confirms password recovery still works | Closes the 24-hour window: a stolen fresh session cannot change the password without knowing the current one. The Security tab already sends `current_password`. |
| Password requirements | Minimum length 12; lowercase, uppercase, digits and symbols | Matches the client policy so direct Auth API calls cannot set weaker passwords. |
| Multi-Factor → TOTP | Enroll and verify enabled | Customers and staff can enroll an authenticator app. |
| Attack Protection → CAPTCHA | Turnstile, with the same site key as `VITE_TURNSTILE_SITE_KEY` | Enable together with `VITE_CAPTCHA_ENABLED=true`. The browser flag alone does not protect the Auth API. |
| Rate limits | Keep the defaults or lower | Limits password guessing and email flooding per IP. |

Leaked-password protection requires a paid plan and remains covered by `docs/SECURITY_RISK_ACCEPTANCE_2026-09-01.md`.

## Account-only checkout

Checkout requires a signed-in account with a confirmed email. `/checkout` is a protected route, and `/api/create-checkout-session` rejects anonymous or unconfirmed requests before contacting Stripe. Each Stripe session carries the account ID in `metadata[portal_user_id]`, and the webhook stores the order against that account. Orders are never matched to accounts by email; `claim_verified_orders` was removed in `20261027130000_retire_guest_order_claiming.sql`.

## Account takeover protections

- The Security tab asks for the current password and a code emailed by `supabase.auth.reauthenticate()`. Supabase enforces these only through the settings above. Without "Require current password", a session created in the last 24 hours can change the password without either.
- After every password change the portal tries to revoke other sessions. Revocation can fail independently, in which case the new password stays in effect and the customer is told to use **Sign out other devices**.
- `/reset-password` accepts only a verified recovery link. An ordinary signed-in session is sent to the Security tab instead.
- Accounts with a verified authenticator must complete a TOTP challenge after sign-in. The API (`verifyUser`) and restrictive RLS policies (`security.mfa_satisfied()`) reject AAL1 sessions for those accounts, so skipping the browser prompt grants no data.
- Supabase has no recovery codes. A customer who loses their authenticator must contact support. Remove the factor with the Auth admin API only after verifying the customer through an independent channel.
- Profile emails follow confirmed Auth email changes through the `on_auth_user_email_changed` trigger.

The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must remain server-only. Never prefix it with `VITE_` or expose it in client code.

## Staff access and backfill

Staff access is disabled unless the server-only `STAFF_PORTAL_ENABLED` flag is exactly `true`. Email addresses are never an authorization source. Customer bootstrap cannot grant, renew, or restore a privileged role.

Staff must be provisioned by immutable Supabase user ID through the service-role-only `grant_staff_access` RPC. Grants require a reason and an expiry of no more than 90 days. Every staff API request requires an active grant, an active Auth session, and Supabase AAL2 MFA. Revoke staff through the protected staff API or `revoke_staff_access`; revocation also deletes the user's Auth sessions.

After an administrator is explicitly enrolled and has elevated the current session with MFA, they can POST to `/api/portal-backfill` with their Supabase bearer token. It scans paid Stripe Checkout Sessions, imports sessions containing Softhe order metadata, and safely upserts them by Stripe session ID. Run it once for initial migration; repeated runs are idempotent for orders and line items.

## Preview payment receiver

`/api/test-fulfillment` is a non-production test harness for Stripe fulfillment evidence. It returns 404 unless Vercel reports the Preview environment and `FULFILLMENT_TEST_MODE=true`. Configure `ORDER_FULFILLMENT_WEBHOOK_URL` to the Preview endpoint, use the same `ORDER_FULFILLMENT_WEBHOOK_SECRET` as the checkout sender, and set a separate random `FULFILLMENT_TEST_EVIDENCE_TOKEN` for evidence reads. When Vercel Deployment Protection is enabled, create a Preview protection-bypass secret and store it server-side as `ORDER_FULFILLMENT_BYPASS_SECRET`; fulfillment requests include it only when configured.

Set `FULFILLMENT_TEST_FAIL_FIRST=true` only for the retry test. The first delivery for each new Checkout Session returns HTTP 503; a later Stripe retry is accepted. Accepted records and attempt counts are stored in Preview Upstash for 30 days by default. The stored record omits customer email. Query a test result with `GET /api/test-fulfillment?session_id=...` and the evidence bearer token. The endpoint is intentionally unavailable in Production even if the feature flag is accidentally copied.

## Security verification

- Confirm anonymous Supabase REST requests cannot read any portal table.
- Confirm two test customers cannot read or update each other's profile, orders, tickets, messages, or activity.
- Confirm customers cannot update `user_roles`, orders, order items, activity events, or webhook event records.
- Confirm a normal customer, an expired staff grant, and an AAL1 staff session cannot access `/admin` data.
- Confirm authenticated browser queries remain ownership-only even for staff accounts.
- Rotate the service-role key immediately if it is ever exposed.
- Confirm an account with a verified TOTP factor cannot read portal tables or call portal APIs with an AAL1 session.
- Confirm a signed-in session without a recovery link cannot set a password at `/reset-password`.
- Confirm `updateUser({ password })` without `current_password` is rejected for a fresh session (Require current password), and without `nonce` for a session older than 24 hours (Secure password change).
