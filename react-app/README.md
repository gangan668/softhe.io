# Softhe.io React application

The browser application is built with React 19, React Router, and Vite. Production also depends on the Vercel functions in the repository-level `api/` directory; a static-only deployment cannot provide checkout, contact delivery, withdrawal acknowledgements, or fulfillment.

## Local development

```bash
npm ci
npm run dev
```

Copy `.env.example` to `.env.local` when local feature or content configuration is needed. Secret Stripe, Redis, EmailJS, fulfillment, and monitoring values belong in the serverless environment and must never use a `VITE_` prefix.

## Quality commands

```bash
npm run lint
npm run test:coverage -- --run
npm run build
npm run budget
npm run e2e:all
npm audit --omit=dev --audit-level=high
```

Playwright allocates one free preview port for the run, refuses to reuse another service, and verifies the Softhe.io application marker before testing routes.

## Production behavior

- `VITE_REQUIRE_PRODUCTION_CONFIG=true` rejects incomplete legal, benchmark, and feature configuration at build time.
- Contact and commerce default to disabled.
- Commerce is enabled only after legal identity, VAT, Stripe, Redis, EmailJS, fulfillment, and monitoring readiness checks pass.
- `/api/health` is the production readiness endpoint.
- The GitHub Pages workflow is a manual, commerce-disabled legacy rollback only.

Use the canonical repository documentation:

- [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) — Vercel configuration, verification, monitoring, and rollback
- [`../docs/COMMERCIAL_LAUNCH_CHECKLIST.md`](../docs/COMMERCIAL_LAUNCH_CHECKLIST.md) — launch blockers and evidence requirements
- [`../api/README.md`](../api/README.md) — serverless endpoint contracts and server variables
