# Supabase rollout: portal security migrations and Auth settings

Instructions for an automated agent (Codex) to apply the database migrations and Supabase Auth settings that accompany the portal security hardening and account-only checkout changes. The owner has authorized these changes. Work on the **Preview** project first, verify it, then repeat for **Production**.

The owner uses the **free plan**. Do not enable anything that requires a paid plan (for example leaked-password protection), and do not change the plan.

## Targets

| Environment | Project ref | Order |
|---|---|---|
| Preview (isolated, disposable data) | `zbchdxptibehtizomwiq` | First |
| Production | `mbwsmyqofkxmxkelqviy` | Only after every Preview check passes |

Confirm both refs with `supabase projects list` before starting. If either ref is missing, or the names suggest the roles are swapped, stop and report.

## Required credentials

Read these from the environment. Never print, log, commit, or paste them into files, and never invent a value.

- `SUPABASE_ACCESS_TOKEN`: a personal access token for the Supabase CLI and Management API.
- `SUPABASE_DB_PASSWORD_PREVIEW` and `SUPABASE_DB_PASSWORD_PRODUCTION`: the database passwords, used by `supabase link` and `supabase db push`.
- `TURNSTILE_SECRET_KEY`: optional. Needed only for step 3c.

If a required credential is missing, stop and ask the owner. Do not work around it.

## Rules

- Do not run `supabase db reset`, drop tables, or delete data. The only destructive statements allowed are those inside the three migration files below.
- Do not edit the migration files. If one fails, stop and report the error.
- Before each Auth settings change, save the current settings to a file **outside the repository**, for example `/tmp/supabase-auth-<ref>-before.json`, with every key containing `secret`, `pass`, `key`, or `token` removed. Never commit this file.
- Change only the Auth fields listed in step 3. Leave every other setting as it is.
- After each step, run its verification. If verification fails, stop, report, and do not continue to Production.

## Step 1: Preflight (each project)

1. From the repository root, run the local database replay and confirm it ends with `MFA-enrolled AAL1 sessions were denied and profile emails stayed synchronized.`:
   ```bash
   cd react-app && npm ci && npm run test:database && cd ..
   ```
2. Link the project: `supabase link --project-ref <ref> --password "$SUPABASE_DB_PASSWORD_<ENV>"`.
3. Run `supabase migration list --linked`. Every migration up to and including `20261016011448_enforce_customer_ticket_api` must show as applied on the remote. Exactly these three must be pending:
   - `20261027120000_require_mfa_for_enrolled_customers.sql`
   - `20261027120100_sync_profile_email.sql`
   - `20261027130000_retire_guest_order_claiming.sql`

   If older migrations show as pending, or the remote has versions that are not in the repository, stop and report the full list. Do not run `migration repair` unless the owner approves it.
4. Confirm the schema objects these migrations depend on exist. Run each query with `supabase db query --linked "<sql>"`, or use `psql` against the linked database:
   ```sql
   select to_regprocedure('security.is_active_user()') is not null as has_is_active_user,
          to_regclass('auth.mfa_factors') is not null as has_mfa_factors,
          to_regprocedure('public.claim_verified_orders(uuid,text)') is not null as claim_function_present;
   ```
   The first two must be `true`. The third should be `true` before migrating and `false` afterwards.
5. Check that no profile email would collide when it is synchronized. This query must return zero rows:
   ```sql
   select lower(u.email) as email, count(*) from auth.users u
   join public.profiles p on p.id = u.id
   group by lower(u.email) having count(*) > 1;
   ```

## Step 2: Apply the migrations (each project)

```bash
supabase db push --linked --password "$SUPABASE_DB_PASSWORD_<ENV>"
```

Confirm that the push lists exactly the three pending files, and nothing else, before it applies them.

### Verify

```sql
-- 7 restrictive MFA policies
select count(*) from pg_policies
 where schemaname = 'public' and policyname like '%_mfa_required' and permissive = 'RESTRICTIVE';
-- expect 7

-- MFA helper exists and is not callable by anon
select has_function_privilege('anon', 'security.mfa_satisfied()', 'execute') as anon_can_execute;
-- expect false

-- Email sync trigger installed
select tgname from pg_trigger where tgname = 'on_auth_user_email_changed';
-- expect 1 row

-- Profile emails match Auth
select count(*) from public.profiles p join auth.users u on u.id = p.id
 where u.email is not null and p.email <> lower(u.email);
-- expect 0

-- Email-based order claiming removed
select to_regprocedure('public.claim_verified_orders(uuid,text)') is null as claim_removed;
-- expect true
```

Then run `supabase migration list --linked` again and confirm all three now show as applied.

## Step 3: Auth settings (each project)

Use the Management API. Before sending anything, download the current OpenAPI spec from `https://api.supabase.com/api/v1-json` and confirm each field name below exists on the `PATCH /v1/projects/{ref}/config/auth` body. Also confirm the allowed values for `password_required_characters`. If a field name differs, use the name the spec documents for the same setting, and report the substitution.

```bash
API=https://api.supabase.com/v1/projects/<ref>/config/auth
curl -sS -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" "$API" > /tmp/auth-full.json
# Save a redacted backup outside the repository, then delete the full copy.
jq 'with_entries(select(.key | test("secret|pass|key|token"; "i") | not))' /tmp/auth-full.json > /tmp/supabase-auth-<ref>-before.json
rm /tmp/auth-full.json
```

### 3a. Core settings (always apply)

| Field | Value | Dashboard name |
|---|---|---|
| `mailer_autoconfirm` | `false` | Email → Confirm email: **on** |
| `mailer_secure_email_change_enabled` | `true` | Secure email change |
| `security_update_password_require_reauthentication` | `true` | Secure password change |
| `password_min_length` | `12` | Minimum password length |
| `password_required_characters` | The spec's value for lowercase, uppercase, digits **and** symbols | Password requirements |
| `mfa_totp_enroll_enabled` | `true` | MFA → TOTP enroll |
| `mfa_totp_verify_enabled` | `true` | MFA → TOTP verify |

```bash
curl -sS -X PATCH "$API" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"mailer_autoconfirm":false,"mailer_secure_email_change_enabled":true,"security_update_password_require_reauthentication":true,"password_min_length":12,"password_required_characters":"<value from spec>","mfa_totp_enroll_enabled":true,"mfa_totp_verify_enabled":true}' \
  -o /dev/null -w '%{http_code}\n'
```

Expect HTTP 200.

### 3b. Redirect URLs (check only)

Read `site_url` and `uri_allow_list` from the backup. `uri_allow_list` must include `/login` and `/reset-password` for the environment's origin: `https://softhe.io` for Production, and the Preview deployment's origin for Preview. If either is missing, report it to the owner rather than guessing the Preview origin.

### 3c. CAPTCHA (only if `TURNSTILE_SECRET_KEY` is set)

If `TURNSTILE_SECRET_KEY` is set, PATCH `{"security_captcha_enabled":true,"security_captcha_provider":"turnstile","security_captcha_secret":"$TURNSTILE_SECRET_KEY"}`. Build the request body so the secret never appears in shell history or output.

After that, tell the owner to set `VITE_CAPTCHA_ENABLED=true` and `VITE_TURNSTILE_SITE_KEY` in the matching Vercel environment and redeploy. Login fails while Supabase requires CAPTCHA but the site does not send a token, so enable both in the same release window.

If the secret is not set, skip this step and list it as pending.

### 3d. Email delivery (check only)

Read `smtp_host` from the backup. If it is empty, the project uses Supabase's built-in email, which allows only a few emails per hour on the free plan. Password-change codes, confirmations, and resets will then quickly hit the limit. Report this as an owner action: configure custom SMTP, for example Resend's free tier. Do not configure SMTP without owner-supplied credentials.

### Verify

GET the config again. Confirm every field from 3a (and 3c if applied) has the new value, and that all other non-secret fields match the backup. Report any difference.

## Step 4: Functional checks (Preview only)

Use throwaway test accounts on the Preview deployment. Never use real customer accounts.

1. **Password policy:** sign up with `weakpassword1`. Supabase must reject it.
2. **Reauthentication:** signed in as a test user, call `updateUser({ password })` without a `nonce`. It must fail with a reauthentication error. On the Security tab, request a code, then submit it with a new password. This must succeed.
3. **MFA gate:** enroll TOTP on a test user and sign out. Sign in with the password only. With that AAL1 token:
   - `GET /rest/v1/profiles` must return `[]`
   - `POST /api/tickets/write` must return 403 `Multi-factor authentication is required.`
   - after entering the TOTP code, the account page must load normally.
4. **Email sync:** change a test user's email and confirm the change. `public.profiles.email` must equal the new address.
5. **Checkout (only if commerce is enabled on Preview):** signed out, opening `/checkout` must go to `/login` with the "Your cart is saved" notice. Calling `/api/create-checkout-session` with no token must return 401.

Delete the test users afterwards (Authentication → Users, or `auth.admin.deleteUser`).

## Step 5: Production

Only after steps 1–4 pass on Preview **and** the related pull request is merged and deployed to Production, repeat steps 1–3 for `mbwsmyqofkxmxkelqviy`. Do not create test accounts on Production.

## Report back

Give the owner one summary covering:
- each project ref, and whether each step passed, was skipped, or failed
- the migration list before and after
- any field-name substitutions from the OpenAPI spec
- pending owner actions: CAPTCHA secret, SMTP, missing redirect URLs
- the paths of the redacted backup files (do not include their contents if anything sensitive remains)

## Rollback

- **Auth settings:** PATCH the values from the redacted backup for the fields changed in step 3.
- **Migrations:** do not reverse them automatically. Report the failure and wait for the owner.
  - The MFA policies can be removed with `drop policy <name>_mfa_required on public.<table>;`.
  - `claim_verified_orders` is not needed by the new code. Restore it from `supabase/migrations/202607310001_customer_portal_security_hardening.sql` only if the owner asks.
