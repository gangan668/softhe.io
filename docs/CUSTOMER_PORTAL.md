# Customer portal setup

The customer portal uses Supabase Auth and Postgres. Passwords are handled only by Supabase Auth; Softhe.io stores profiles, orders, tickets, and activity records.

## Provisioning

1. Create a Supabase project in the EU region appropriate for the business.
2. Run `supabase/migrations/202607220001_customer_portal.sql` in the Supabase SQL editor or with the Supabase CLI.
3. Enable email/password authentication and require email confirmation. Add `https://softhe.io/login` and `https://softhe.io/reset-password` plus the preview equivalents to the allowed redirect URLs.
4. Add the browser variables from `react-app/.env.example` and server variables from `.env.example` to the matching Vercel environments.
5. Create an EmailJS ticket template using `to_email`, `customer_name`, `ticket_id`, `ticket_subject`, `ticket_status`, and `reply_preview`; set its ID as `EMAILJS_TICKET_TEMPLATE_ID`.
6. Replace the Supabase wildcard entries in `vercel.json` with the exact project HTTPS and WSS origins before production release if the project hostname is fixed.

The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must remain server-only. Never prefix it with `VITE_` or expose it in client code.

## Staff access and backfill

Comma-separated, verified emails in `ADMIN_EMAIL_ALLOWLIST` are promoted to `admin` by `/api/portal-bootstrap` after login. Removing an email from the variable demotes that account to `customer` on its next session bootstrap.

After deploying the schema and server variables, an allowlisted administrator can POST to `/api/portal-backfill` with their Supabase bearer token. It scans paid Stripe Checkout Sessions, imports sessions containing Softhe order metadata, and safely upserts them by Stripe session ID. Run it once for initial migration; repeated runs are idempotent for orders and line items.

## Security verification

- Confirm anonymous Supabase REST requests cannot read any portal table.
- Confirm two test customers cannot read or update each other's profile, orders, tickets, messages, or activity.
- Confirm customers cannot update `user_roles`, orders, order items, activity events, or webhook event records.
- Confirm only staff can change ticket status or access `/admin` data.
- Rotate the service-role key immediately if it is ever exposed.
