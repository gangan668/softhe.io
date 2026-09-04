# 2026-08-13 Preview staff authorization incident

## Summary

A verified Preview account whose email appeared in `ADMIN_EMAIL_ALLOWLIST` was automatically assigned `admin` by customer bootstrap. The account could consequently read cross-customer data allowed by the former staff RLS policies. Production promotion is blocked.

## Observed exposure

- Environment: Vercel Preview, `customer-portal-test`
- Observed privileged account: one test account (masked in operational records)
- Records visible in the reported staff view: 2 customer profiles, 2 tickets, 0 orders
- Sensitive fields potentially visible: customer email, ticket subject, ticket messages, account status
- No evidence of service-role key disclosure was found in the reviewed Auth and Postgres logs.

## Containment

- Revoked every `staff` and `admin` grant and deleted their Auth sessions.
- Verified zero active privileged roles after containment.
- Removed `ADMIN_EMAIL_ALLOWLIST` from Preview and Production configuration.
- Set `STAFF_PORTAL_ENABLED=false` in Preview and Production.
- Applied ownership-only customer RLS policies and recorded the emergency revocation event.

## Remediation and release condition

Staff access is now based on explicit, expiring user-ID grants, an active Auth session, and AAL2 MFA. Cross-customer operations are available only through the server-mediated staff API and are audited. Re-enable the staff portal only after an administrator is explicitly enrolled, MFA is verified, and Preview penetration checks pass.
