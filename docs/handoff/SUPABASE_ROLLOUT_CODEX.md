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
- `SUPABASE_DB_PASSWORD_PREVIEW` and `SUPABASE_DB_PASSWORD_PRODUCTION`: the database passwords. Needed only for the CLI path below; the Management API path (see "Applying migrations without the database password" in step 2) needs only the access token. Pass them to the CLI only through its `SUPABASE_DB_PASSWORD` environment variable. Never use `--password`, because command-line arguments are visible to other processes (`ps`, `/proc/<pid>/cmdline`).
- `TURNSTILE_SECRET_KEY`: optional. Needed only for step 3c.

If a credential required by the chosen path is missing, stop and ask the owner. Do not work around it.

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
2. CLI path only: link the project without putting the password in the arguments: `SUPABASE_DB_PASSWORD="$SUPABASE_DB_PASSWORD_<ENV>" supabase link --project-ref <ref>`.
3. List the remote migration history (`supabase migration list --linked`, or `select version, name from supabase_migrations.schema_migrations order by version` through the Management API). On Preview, every migration up to and including `20261016011448_enforce_customer_ticket_api` must show as applied, and exactly these three must be pending. On Production, step 5 lists the expected differences instead; anything beyond them is a stop:
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

Confirm that the push lists exactly the pending files expected for this project, and nothing else, before it applies them. That is the three files above on Preview, and the seven files listed in step 5 on Production.

**Applying migrations without the database password:** use the Management API's SQL query endpoint instead. Apply each pending file unmodified and in version order. In the same transaction, insert its repository version and name into `supabase_migrations.schema_migrations`. The same rule applies: only the expected pending files.

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

# Drops only fields whose names end in a secret suffix (smtp_pass, *_secret, *_token, *_api_key ...).
# The pattern deliberately does not match "password", so non-secret settings such as
# password_min_length and security_update_password_require_current_password are kept.
REDACT='with_entries(select(.key | test("(secret|secrets|_pass|token|_key)$"; "i") | not))'

# Prints the current Auth config with secret fields removed. Never print raw `mgmt GET` output:
# it contains SMTP, CAPTCHA and provider secrets, and Codex output may be shared.
auth_get_redacted() {
  local raw; raw="$(mktemp)"
  if ! mgmt GET > "$raw"; then rm -f -- "$raw"; echo "GET FAILED" >&2; return 1; fi
  jq "$REDACT" "$raw"; local rc=$?; rm -f -- "$raw"; return "$rc"
}

# Applies a JSON body file, then deletes it. On failure, prints the error response with
# secret-looking fields masked, and stops the rollout.
auth_patch() {
  local out; out="$(mktemp)"
  if mgmt PATCH "$1" > "$out" 2>&1; then rm -f -- "$out" "$1"; echo "PATCH ok"; return 0; fi
  echo "PATCH FAILED: stop the rollout. Sanitized response:" >&2
  jq "$REDACT" "$out" >&2 2>/dev/null \
    || sed -E 's/("[^"]*(secret|_pass|token|_key)"[[:space:]]*:[[:space:]]*)"[^"]*"/\1"[redacted]"/Ig' "$out" >&2
  rm -f -- "$out" "$1"; exit 1
}

# The unredacted response contains secrets: keep it in a private, auto-deleted file.
auth_full="$(mktemp)"
trap 'rm -f -- "$auth_full"' EXIT
if ! mgmt GET > "$auth_full"; then echo "Initial Auth GET failed: stop, nothing was changed" >&2; exit 1; fi
# Require a real Auth config, not an error body, before anything is changed. These fields must
# exist in the live response; without them there is no usable rollback snapshot.
jq -e 'type == "object" and (. as $cfg | ["mailer_autoconfirm", "mailer_secure_email_change_enabled",
  "security_update_password_require_reauthentication", "password_min_length", "password_required_characters",
  "mfa_totp_enroll_enabled", "mfa_totp_verify_enabled"] | all(. as $k | $cfg | has($k)))' "$auth_full" > /dev/null \
  || { echo "Initial Auth GET is not a usable snapshot: stop, nothing was changed" >&2; exit 1; }
# mktemp creates a new private file, so a pre-planted path or symlink cannot redirect the backup.
auth_backup="$(mktemp /tmp/supabase-auth-<ref>-before.XXXXXX)"
jq "$REDACT" "$auth_full" > "$auth_backup"
chmod 600 "$auth_backup"
printf 'Redacted backup: %s\n' "$auth_backup"
# Rollback needs these keys. All required ones must be in the backup. The optional ones
# (current-password and CAPTCHA provider fields) must be kept whenever the live config has them.
jq -e --slurpfile full "$auth_full" '. as $backup
  | (["password_min_length", "password_required_characters", "security_update_password_require_reauthentication",
      "mailer_autoconfirm", "mailer_secure_email_change_enabled", "mfa_totp_enroll_enabled", "mfa_totp_verify_enabled"]
     | all(. as $k | $backup | has($k)))
  and (["security_update_password_require_current_password", "security_captcha_enabled", "security_captcha_provider"]
     | all(. as $k | ($full[0] | has($k) | not) or ($backup | has($k))))' "$auth_backup" > /dev/null \
  || { echo "Backup is missing rollback fields: stop, nothing was changed" >&2; exit 1; }
```

Make every later Management API call through `auth_get_redacted` or `auth_patch`. Never call `mgmt GET` directly in a way that prints its output, and never pass `-H "Authorization: ..."` on the command line.

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
auth_patch "$body"
```

Expect `PATCH ok`. `--fail-with-body` makes curl exit non-zero on an HTTP error. On `PATCH FAILED`, the rollout stops: do not run any later step or the other project. Run `auth_get_redacted` and compare it with `$auth_backup` to see which fields changed. Restore them from the backup if needed, and report the sanitized error and the differences.

### 3a-2. Require current password (Preview check first)

Supabase skips the emailed reauthentication code for sessions created in the last 24 hours. The "Require current password when changing password" setting closes that gap. The Security tab already sends `current_password`.

1. Confirm the field name in the OpenAPI spec. It is expected to be `security_update_password_require_current_password`. If the spec has no such field, skip this step and report it as unavailable. Apply it with a body file and `auth_patch`, as in 3a.
2. **Preview:** enable it (stop on `PATCH FAILED`, as in 3a), then repeat the password-recovery check in step 4 (item 2b). If a recovery-link reset is rejected because no current password was sent, restore the setting's **previous value from the backup** (do not hard-code `false`, because it may already have been on), then report that it conflicts with password recovery:
   ```bash
   body="$(mktemp)"
   jq '{security_update_password_require_current_password}' "$auth_backup" > "$body"
   auth_patch "$body"
   ```
3. **Production:** enable it only if the Preview recovery check passed.

### 3b. Redirect URLs (check only)

Read `site_url` and `uri_allow_list` from the backup. `uri_allow_list` must include `/login` and `/reset-password` for the environment's origin: `https://softhe.io` for Production, and the Preview deployment's origin for Preview. If either is missing, report it to the owner rather than guessing the Preview origin.

### 3c. CAPTCHA (only if `TURNSTILE_SECRET_KEY` is set)

If `TURNSTILE_SECRET_KEY` is set, first make sure the change can be rolled back. The backup removes `security_captcha_secret`, so the previous secret cannot be restored from it:

- If `jq -r '.security_captcha_enabled' "$auth_backup"` is `false` or `null`, CAPTCHA is currently off. Rolling back means setting `security_captcha_enabled` to `false`, and the old secret is not needed.
- If it is `true` and `jq -r '.security_captcha_provider' "$auth_backup"` is not `turnstile` (for example `hcaptcha`), skip 3c. Switching providers is an owner decision; report the current provider.
- If it is `true` and the provider is already `turnstile`, this step would overwrite its secret. Continue only if the owner has also provided the current secret as `TURNSTILE_PREVIOUS_SECRET_KEY`. Otherwise skip 3c and report that rollback would be impossible.

Then build the body inside `jq` from the environment. The secret is never a command argument and never printed:

```bash
body="$(mktemp)"
jq -n '{security_captcha_enabled: true, security_captcha_provider: "turnstile", security_captcha_secret: env.TURNSTILE_SECRET_KEY}' > "$body"
auth_patch "$body"
```

After that, tell the owner to set `VITE_CAPTCHA_ENABLED=true` and `VITE_TURNSTILE_SITE_KEY` in the matching Vercel environment and redeploy. Login fails while Supabase requires CAPTCHA but the site does not send a token, so enable both in the same release window.

If the secret is not set, skip this step and list it as pending.

### 3d. Email delivery (check only)

Read `smtp_host` from the backup. If it is empty, the project uses Supabase's built-in email, which allows only a few emails per hour on the free plan. Password-change codes, confirmations, and resets will then quickly hit the limit. Report this as an owner action: configure custom SMTP, for example Resend's free tier. Do not configure SMTP without owner-supplied credentials.

### Verify

Run `auth_get_redacted` again. Confirm every field from 3a (and 3a-2 or 3c if applied) has the new value, and that all other non-secret fields match the backup. Report any difference.

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

### What the Preview run (2026-10-27) and Production preflight (2026-10-28) showed

- **Token scope.** A scoped token with only Auth Config write gets HTTP 403 on `PATCH /config/auth`. Create a token limited to the one project, with **Auth Config, Project Settings, Database and Migrations** read-write and a 1-day expiry. Revoke it when finished.
- **No database password needed.** Instead of `supabase db push`, each migration may be applied with the Management API's SQL query endpoint, inserting the repository version into `supabase_migrations.schema_migrations` in the same transaction. Use the unmodified file contents.
- **Migration history uses different version numbers.** The migrations were originally applied with other version numbers. Renumbering the history is allowed only after comparing every stored SQL body with its repository file, showing the owner the mapping, and getting approval. Never replay an old migration to "fix" the history.
- **Production differs from Preview.** The preflight found the following. Re-check it; do not trust this list blindly.
  - 7 repository migrations are missing on Production, not 3. Apply them in version order: `20260813095000_make_customer_ticket_rpcs_invoker`, `20260827152811_least_privilege_portal_grants`, `20260827160512_transactional_staff_revocation_audit`, `20261016011448_enforce_customer_ticket_api`, then the three migrations in this runbook.
  - 2 migrations exist only on Production. They are already covered by repository files, so the schema matches:
    - `20260727025008_restrict_is_staff_execution` is undone by the later `restore_is_staff_policy_execution`.
    - `20260731174301_record_ticket_creation_activity` together with the shorter Production `fix_ticket_category_type` equals the repository's `202607310002_fix_ticket_category_type`.

    Propose marking both as reverted (`supabase migration repair --status reverted <version>`, or deleting their history rows) and wait for owner approval.
  - The other "different" bodies differ only in comments and whitespace.
  - Production has 0 unlinked orders, so step 1.5 passes.
  - Production Auth already matches step 3a. Only `security_update_password_require_current_password` (step 3a-2) is still `false`. Preview proved it does not break recovery-link resets, so enable it.
- **CAPTCHA.** Turnstile is on in both projects. Never disable it on Production, not even temporarily; Production has no automated test accounts that would need it off.

## Report back

Give the owner one summary covering:
- each project ref, and whether each step passed, was skipped, or failed
- the migration list before and after
- any field-name substitutions from the OpenAPI spec
- pending owner actions: CAPTCHA secret, SMTP, missing redirect URLs
- the `mktemp` paths of the redacted backup files (do not include their contents if anything sensitive remains)

## Rollback

- **Auth settings:** build a body from the redacted backup with only the fields changed in step 3, for example `jq '{mailer_autoconfirm, password_min_length}' "$auth_backup"`, and apply it with `auth_patch`.
- **CAPTCHA:** if CAPTCHA was off before, PATCH `{"security_captcha_enabled": false}` and restore `security_captcha_provider` from the backup. If it was on (step 3c only runs then when the provider was already `turnstile`), restore the provider from the backup together with the matching previous secret: `jq --slurpfile b "$auth_backup" -n '{security_captcha_enabled: true, security_captcha_provider: $b[0].security_captcha_provider, security_captcha_secret: env.TURNSTILE_PREVIOUS_SECRET_KEY}'`.
- **Migrations:** do not reverse them automatically. Report the failure and wait for the owner.
  - The MFA policies can be removed with `drop policy <name>_mfa_required on public.<table>;`.
  - `claim_verified_orders` is not needed by the new code. Restore it from `supabase/migrations/202607310001_customer_portal_security_hardening.sql` only if the owner asks.
