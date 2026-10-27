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
- `SUPABASE_DB_PASSWORD_PREVIEW` and `SUPABASE_DB_PASSWORD_PRODUCTION`: the database passwords. Pass them to the CLI only through its `SUPABASE_DB_PASSWORD` environment variable. Never use `--password`, because command-line arguments are visible to other processes (`ps`, `/proc/<pid>/cmdline`).
- `TURNSTILE_SECRET_KEY`: optional. Needed only for step 3c.

If a required credential is missing, stop and ask the owner. Do not work around it.

## Rules

- Do not run `supabase db reset`, drop tables, or delete data. The only destructive statements allowed are those inside the three migration files below.
- Do not edit the migration files. If one fails, stop and report the error.
- Before each Auth settings change, save the current settings to a file **outside the repository**, created with `mktemp` (step 3), with secret-valued keys removed. Never commit this file.
- Change only the Auth fields listed in step 3. Leave every other setting as it is.
- After each step, run its verification. If verification fails, stop, report, and do not continue to Production.

## Step 1: Preflight (each project)

1. From the repository root, run the local database replay and confirm it ends with `MFA-enrolled AAL1 sessions were denied and profile emails stayed synchronized.`:
   ```bash
   cd react-app && npm ci && npm run test:database && cd ..
   ```
2. Link the project without putting the password in the arguments: `SUPABASE_DB_PASSWORD="$SUPABASE_DB_PASSWORD_<ENV>" supabase link --project-ref <ref>`.
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
5. Count paid orders that are not linked to an account. Migration `20261027130000` removes email-based order claiming, so these would otherwise stay unlinked:
   ```sql
   select count(*) as unlinked_orders,
          count(*) filter (where status = 'paid') as unlinked_paid
     from public.orders where user_id is null;
   ```
   - **Preview:** any count is acceptable, because these are sandbox test orders. Record the numbers.
   - **Production:** if `unlinked_paid` is greater than 0, stop before step 2 and report the count to the owner. Do not link orders by email yourself. The owner decides each case and links an order manually (`update public.orders set user_id = '<verified account id>' where id = '<order id>'`) only after confirming ownership through Stripe and the customer.
6. Check that no profile email would collide when it is synchronized. This query must return zero rows:
   ```sql
   select lower(u.email) as email, count(*) from auth.users u
   join public.profiles p on p.id = u.id
   group by lower(u.email) having count(*) > 1;
   ```

## Step 2: Apply the migrations (each project)

```bash
SUPABASE_DB_PASSWORD="$SUPABASE_DB_PASSWORD_<ENV>" supabase db push --linked
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
umask 077
# Sends the access token through a private curl config on stdin. printf is a shell builtin,
# so the token never appears in any process's arguments (ps, /proc/<pid>/cmdline).
mgmt() { # usage: mgmt METHOD [json-body-file]
  printf 'header = "Authorization: Bearer %s"\n' "$SUPABASE_ACCESS_TOKEN" |
    curl -sS --fail-with-body -K - -X "$1" -H "Content-Type: application/json" ${2:+--data-binary "@$2"} "$API"
}

# The unredacted response contains secrets: keep it in a private, auto-deleted file.
auth_full="$(mktemp)"
trap 'rm -f -- "$auth_full"' EXIT
mgmt GET > "$auth_full"
# Drop only fields whose names end in a secret suffix (smtp_pass, *_secret, *_token, *_api_key ...).
# The pattern deliberately does not match "password", so non-secret settings such as
# password_min_length and security_update_password_require_current_password stay in the backup.
# mktemp creates a new private file, so a pre-planted path or symlink cannot redirect the backup.
auth_backup="$(mktemp /tmp/supabase-auth-<ref>-before.XXXXXX)"
jq 'with_entries(select(.key | test("(secret|secrets|_pass|token|_key)$"; "i") | not))' "$auth_full" > "$auth_backup"
chmod 600 "$auth_backup"
printf 'Redacted backup: %s\n' "$auth_backup"
# Rollback needs these keys. Confirm each one that the live config has survived redaction.
jq -e --slurpfile full "$auth_full" '. as $backup | ["password_min_length", "password_required_characters",
  "security_update_password_require_reauthentication", "security_update_password_require_current_password",
  "mailer_autoconfirm", "mailer_secure_email_change_enabled", "mfa_totp_enroll_enabled", "mfa_totp_verify_enabled"]
  | all(. as $k | ($full[0] | has($k) | not) or ($backup | has($k)))' "$auth_backup"
```

Run every later Management API call through `mgmt`. Never pass `-H "Authorization: ..."` on the command line.

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
body="$(mktemp)"
cat > "$body" <<'JSON'
{"mailer_autoconfirm":false,"mailer_secure_email_change_enabled":true,"security_update_password_require_reauthentication":true,"password_min_length":12,"password_required_characters":"<value from spec>","mfa_totp_enroll_enabled":true,"mfa_totp_verify_enabled":true}
JSON
if mgmt PATCH "$body" > /dev/null; then echo "PATCH ok"; else rm -f -- "$body"; echo "PATCH FAILED: stop the rollout and report" >&2; exit 1; fi
rm -f -- "$body"
```

Expect `PATCH ok`. `--fail-with-body` makes curl exit non-zero on an HTTP error. On `PATCH FAILED`, stop the rollout: do not run any later step or the other project. Run `mgmt GET` to see which fields changed, restore them from the backup if needed, and report the response body.

### 3a-2. Require current password (Preview check first)

Supabase skips the emailed reauthentication code for sessions created in the last 24 hours. The "Require current password when changing password" setting closes that gap. The Security tab already sends `current_password`.

1. Confirm the field name in the OpenAPI spec. It is expected to be `security_update_password_require_current_password`. If the spec has no such field, skip this step and report it as unavailable. Apply it with `mgmt PATCH` and a body file, as in 3a.
2. **Preview:** enable it (stop on `PATCH FAILED`, as in 3a), then repeat the password-recovery check in step 4 (item 2b). If a recovery-link reset is rejected because no current password was sent, disable the setting again and report that it conflicts with password recovery.
3. **Production:** enable it only if the Preview recovery check passed.

### 3b. Redirect URLs (check only)

Read `site_url` and `uri_allow_list` from the backup. `uri_allow_list` must include `/login` and `/reset-password` for the environment's origin: `https://softhe.io` for Production, and the Preview deployment's origin for Preview. If either is missing, report it to the owner rather than guessing the Preview origin.

### 3c. CAPTCHA (only if `TURNSTILE_SECRET_KEY` is set)

If `TURNSTILE_SECRET_KEY` is set, build the body inside `jq` from the environment. The secret is never a command argument and never printed:

```bash
body="$(mktemp)"
jq -n '{security_captcha_enabled: true, security_captcha_provider: "turnstile", security_captcha_secret: env.TURNSTILE_SECRET_KEY}' > "$body"
if mgmt PATCH "$body" > /dev/null; then echo "PATCH ok"; else rm -f -- "$body"; echo "PATCH FAILED: stop the rollout and report" >&2; exit 1; fi
rm -f -- "$body"
```

After that, tell the owner to set `VITE_CAPTCHA_ENABLED=true` and `VITE_TURNSTILE_SITE_KEY` in the matching Vercel environment and redeploy. Login fails while Supabase requires CAPTCHA but the site does not send a token, so enable both in the same release window.

If the secret is not set, skip this step and list it as pending.

### 3d. Email delivery (check only)

Read `smtp_host` from the backup. If it is empty, the project uses Supabase's built-in email, which allows only a few emails per hour on the free plan. Password-change codes, confirmations, and resets will then quickly hit the limit. Report this as an owner action: configure custom SMTP, for example Resend's free tier. Do not configure SMTP without owner-supplied credentials.

### Verify

Run `mgmt GET` again. Confirm every field from 3a (and 3a-2 or 3c if applied) has the new value, and that all other non-secret fields match the backup. Report any difference.

## Step 4: Functional checks (Preview only)

Use throwaway test accounts on the Preview deployment. Never use real customer accounts.

1. **Password policy:** sign-ups with `weakpassword1` (no uppercase or symbol) and `Shrt-Pass1!` (11 characters, every required class) must both be rejected. `Short-Pass1!` (12 characters, every class) must be accepted, so the length minimum is tested on its own.
2. **Password changes:**
   a. **Fresh session** (signed in just now): `updateUser({ password })` without `current_password` must fail if step 3a-2 was applied. Without that setting it succeeds, and this is the expected 24-hour exemption: record it rather than reporting a failure.
   b. **Recovery:** request a reset email, open the link, and set a new password on `/reset-password`. This must succeed, including after step 3a-2.
   c. **Security tab:** request a code, then submit it with the current password and a new password. This must succeed.
   d. **Stale session:** if you can use a session older than 24 hours (or one whose creation time was moved back on Preview only), `updateUser({ password })` without `nonce` must fail.
3. **MFA gate:** enroll TOTP on a test user and sign out. Sign in with the password only. With that AAL1 token:
   - `GET /rest/v1/profiles` must return `[]`
   - `POST /api/tickets/write` must return 403 `Multi-factor authentication is required.`
   - after entering the TOTP code, the account page must load normally.
4. **Email sync:** change a test user's email and confirm the change. `public.profiles.email` must equal `lower(<new address>)`, because the migration stores emails in lowercase. Use a mixed-case address to exercise this.
5. **Checkout (only if commerce is enabled on Preview):** signed out, opening `/checkout` must go to `/login` with the "Your cart is saved" notice. Calling `/api/create-checkout-session` with no token must return 401. With the token of a test account whose email is not yet confirmed, it must return 403 (`Verify your email before placing an order`). In both cases no Checkout Session may appear in the Stripe test dashboard.

Delete the test users afterwards (Authentication → Users, or `auth.admin.deleteUser`).

## Step 5: Production

Only after steps 1–4 pass on Preview **and** the related pull request is merged and deployed to Production, repeat steps 1–3 for `mbwsmyqofkxmxkelqviy`. Do not create test accounts on Production.

## Report back

Give the owner one summary covering:
- each project ref, and whether each step passed, was skipped, or failed
- the migration list before and after
- any field-name substitutions from the OpenAPI spec
- pending owner actions: CAPTCHA secret, SMTP, missing redirect URLs
- the `mktemp` paths of the redacted backup files (do not include their contents if anything sensitive remains)

## Rollback

- **Auth settings:** PATCH the values from the redacted backup for the fields changed in step 3.
- **Migrations:** do not reverse them automatically. Report the failure and wait for the owner.
  - The MFA policies can be removed with `drop policy <name>_mfa_required on public.<table>;`.
  - `claim_verified_orders` is not needed by the new code. Restore it from `supabase/migrations/202607310001_customer_portal_security_hardening.sql` only if the owner asks.
