# Supabase leaked-password residual-risk acceptance

- Decision date: 2026-09-01
- Decision owner: Hannes Axelsson
- Scope: Supabase Auth leaked-password lookup for Softhe.io while the organization remains on the Free plan
- Decision: Accept the residual risk instead of purchasing a Supabase Pro upgrade at this release stage
- Reason: Supabase exposes the leaked-password control only on Pro plans and above
- Compensating controls: 12-character mixed-class application password policy, mandatory email verification, Cloudflare Turnstile, generic authentication errors, provider rate limits, recent-authentication checks for password changes, and session revocation
- Limitation: This acceptance does not waive tenant isolation, RLS, MFA, session-revocation, dependency, secret-scanning, monitoring, legal, Stripe, fulfillment, or any other release requirement
- Review trigger: Reassess before enabling commerce, after an authentication incident, or when moving the Supabase organization to Pro

The preferred long-term remediation remains enabling **Prevent use of leaked passwords** in Supabase Auth and verifying rejection of a known compromised test password.
