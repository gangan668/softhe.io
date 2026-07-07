# Staging Checklist

Use this checklist before promoting a build to production.

## Automated gates

- GitHub Actions CI passes lint, unit tests, and build.
- E2E Smoke Tests pass on desktop and mobile Chromium.
- Staging Build Artifact is generated from the target branch.

## Manual gates

- Open the staging artifact or staging URL and verify navigation, mobile menu, cart, checkout, contact, FAQ, guides, and 404 fallback.
- Confirm the Stripe payment links open the expected products.
- Confirm bundle checkout language still says manual invoicing unless the serverless endpoint is deployed.
- Confirm EmailJS environment variables are set for the staging environment.
- Confirm analytics consent behavior before checking GA events.

## Promotion decision

Promote only after the build artifact and manual checks match the intended release scope.
