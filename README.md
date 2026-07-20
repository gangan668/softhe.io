# Softhe.io

Softhe.io is a React storefront and information site for Windows and BIOS optimization products and services. The repository combines a Vite client in `react-app/` with Vercel-compatible serverless functions in `api/`.

## Repository layout

```text
api/             Contact, checkout, health, withdrawal, webhook, and durable helpers
docs/            Current deployment and commercial-launch documentation
react-app/       React client, tests, build scripts, and public assets
archive_legacy/  Historical static-site material; not deployed
vercel.json      Production build and security-header configuration
```

## Start here

```bash
cd react-app
npm ci
npm run dev
```

Before releasing, run the full gate documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and complete [`docs/COMMERCIAL_LAUNCH_CHECKLIST.md`](docs/COMMERCIAL_LAUNCH_CHECKLIST.md). Live commerce is intentionally fail-closed until the real Swedish operator identity, legal review, provider configuration, fulfillment test, and monitoring evidence are complete.

The latest verified repository and live-environment status is recorded in [`docs/READINESS_STATUS.md`](docs/READINESS_STATUS.md).
