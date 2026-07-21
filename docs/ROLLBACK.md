# Production rollback record

Last verified: 2026-07-21 (Europe/Berlin)

## Known deployment targets

| Role | Origin or identifier | Evidence |
| --- | --- | --- |
| Current public production | `https://softhe.io` on GitHub Pages | Pages run `29711027437`, commit `5417994f898fed04707e4c39b26e2a7eafac8f12` |
| Vercel release candidate | `https://softhe-io.vercel.app` | Deployment `dpl_H2dX91FeyYMUJpEdxnrbesTUNVkV`; source `e44fbc79e5f3ba47b17e21e0259552cf4cc3a15c`; fingerprint `softhe-20260721011202-e44fbc7-8145c7bf5a3f4700`; contact and commerce disabled |

The custom domain still points to GitHub Pages. Do not change the records below until the
Vercel health endpoint is ready and the commercial launch checklist is complete.

## Public resolver baseline

Observed at `2026-07-21T02:30:00+02:00` from the release workstation:

- `https://softhe.io/` returned HTTP 200 with `Server: GitHub.com`.
- A deliberately missing path returned HTTP 404.
- The apex resolved to the four GitHub Pages IPv4 and four IPv6 addresses recorded below.
- `www.softhe.io` did not return an A, AAAA, or CNAME answer from the workstation resolver.
- `https://softhe-io.vercel.app/` returned HTTP 200, the expected Content-Security-Policy,
  `X-Content-Type-Options: nosniff`, and a true HTTP 404 for the same missing-path probe.

This is a public-resolution baseline, not the required DNS-provider zone export. Capture the
provider export, TTLs, account/zone identifier, and approver immediately before cutover.

## Current GitHub Pages DNS target

The apex currently resolves to GitHub Pages:

```text
A     185.199.108.153
A     185.199.109.153
A     185.199.110.153
A     185.199.111.153
AAAA  2606:50c0:8000::153
AAAA  2606:50c0:8001::153
AAAA  2606:50c0:8002::153
AAAA  2606:50c0:8003::153
```

Immediately before cutover, record the DNS provider, zone-record screenshot/export, TTL,
current Vercel deployment ID, and the operator who approved the change. DNS evidence must be
captured again if any value above changes.

## Cutover rollback procedure

1. Keep commerce and contact disabled while diagnosing any cutover failure.
2. If the Vercel deployment itself regressed, promote the recorded last-known-good Vercel
   deployment before changing DNS.
3. If the Vercel origin, TLS, routing, serverless health, or provider integration cannot be
   restored promptly, restore the apex A and AAAA records above at the DNS provider.
4. Wait for the recorded TTL, then verify `https://softhe.io`, a true 404, and the expected host
   headers. GitHub Pages is only a static rollback target: `/api/health` and all transactional
   functions will remain unavailable.
5. Rerun the production smoke. Do not re-enable contact or commerce until the incident is
   closed and the Vercel health endpoint is ready again.

## Promotion evidence still required

- DNS provider and current zone export
- Vercel deployment ID approved for production
- passing strict production-smoke run
- successful Stripe, Upstash, EmailJS, withdrawal, fulfillment, and monitoring tests
- legal/accounting approval record
- named rollback operator and decision owner
