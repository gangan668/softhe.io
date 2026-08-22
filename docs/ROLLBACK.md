# Production rollback record

Last verified: 2026-08-22 (Europe/Berlin)

## Known deployment targets

| Role | Origin or identifier | Evidence |
| --- | --- | --- |
| Current public production | `https://softhe.io` on GitHub Pages | Pages run `29711027437`, commit `5417994f898fed04707e4c39b26e2a7eafac8f12` |
| Vercel release candidate | `https://softhe-cinsvqhf5-suportsofthe-9420s-projects.vercel.app` | Deployment `dpl_HvKyFLtDp7tCPeimF1SRZdnCvTU3`; source `27e2a0fa656a0e55693cda7bcd150d286106dcde`; fingerprint `softhe-27e2a0f-stage1`; `/api/health` ready with all required checks true |
| Preview rollback candidate | `https://softhe-28md2dy4z-suportsofthe-9420s-projects.vercel.app` | Deployment `dpl_EfhsJ1urLkqn1H9hXdn1zczq2vLW`; `/api/health` ready at rehearsal time |

The custom domain still points to GitHub Pages. Do not change the records below until the
Vercel health endpoint is ready and the commercial launch checklist is complete.

## Public resolver baseline

Observed again at `2026-08-22T19:04:39+02:00` from the release workstation:

- `https://softhe.io/` returned HTTP 200 with `Server: GitHub.com`.
- A deliberately missing path returned HTTP 404.
- The apex resolved to the four GitHub Pages IPv4 and four IPv6 addresses recorded below.
- The authoritative nameservers were `ns1.dyna-ns.net` and `ns2.dyna-ns.net`; the observed record TTL was 300 seconds.
- `www.softhe.io` did not return an A, AAAA, or CNAME answer from the workstation resolver.
- `https://softhe-io.vercel.app/` returned HTTP 200, the expected Content-Security-Policy,
  `X-Content-Type-Options: nosniff`, and a true HTTP 404 for the same missing-path probe.

This is a public-resolution baseline, not the required DNS-provider zone export. Capture the
provider export, TTLs, account/zone identifier, and approver immediately before cutover.

## Preview rollback rehearsal

On 2026-08-13, the stable `customer-portal-test` Preview alias was moved from deployment
`dpl_CH3LjgqSXQyEGDz2V8HVC7Aw74Se` to prior ready deployment
`dpl_EfhsJ1urLkqn1H9hXdn1zczq2vLW`, then restored to the candidate. Both immutable deployments
returned `status: ready` with every `/api/health` check true. No production alias or DNS record
was changed during this rehearsal.

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
