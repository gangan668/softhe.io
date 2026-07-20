# Production rollback record

Last verified: 2026-07-20 (Europe/Berlin)

## Known deployment targets

| Role | Origin or identifier | Evidence |
| --- | --- | --- |
| Current public production | `https://softhe.io` on GitHub Pages | Pages run `29711027437`, commit `5417994f898fed04707e4c39b26e2a7eafac8f12` |
| Vercel release candidate | `https://softhe-io.vercel.app` | Deployment `dpl_2wivqTZS8j2YnPe7GiJsJGM96fRb`; source `75e1ff40cdcc86172a597db182d1ca1941b07a10`; contact and commerce disabled |

The custom domain still points to GitHub Pages. Do not change the records below until the
Vercel health endpoint is ready and the commercial launch checklist is complete.

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
