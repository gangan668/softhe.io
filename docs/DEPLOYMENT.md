# Production Deployment

Softhe.io must be deployed to a Node serverless host. GitHub Pages is not a supported production target because it cannot run the checkout, contact, or Stripe webhook functions in `/api`.

## Vercel

1. Import `gangan668/softhe.io` into Vercel.
2. Keep the repository root as the project root. The checked-in `vercel.json` builds `react-app` and exposes `/api/*` functions.
3. Attach the production domain and set `PUBLIC_SITE_URL` to its HTTPS origin.
4. Configure the environment variables below for Production and Preview as appropriate.
5. Add `https://<production-domain>/api/stripe-webhook` in Stripe and subscribe to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.expired`
6. Connect the GitHub repository in Vercel so pull requests receive preview deployments and `main` deploys to production.

## Required Server Variables

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | Trusted origin for Stripe success and cancellation URLs |
| `STRIPE_SECRET_KEY` | Creates Stripe Checkout Sessions |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures |
| `UPSTASH_REDIS_REST_URL` | Durable rate-limit and fulfillment state |
| `UPSTASH_REDIS_REST_TOKEN` | Server-only Redis write token |
| `CONTACT_RATE_LIMIT_SECRET` | HMAC key used to pseudonymize contact-form IP addresses |
| `EMAILJS_SERVICE_ID` | EmailJS service used by the server function |
| `EMAILJS_TEMPLATE_ID` | EmailJS contact template |
| `EMAILJS_PUBLIC_KEY` | EmailJS account public key |
| `EMAILJS_PRIVATE_KEY` | Optional EmailJS private key |
| `ORDER_FULFILLMENT_WEBHOOK_URL` | HTTPS endpoint that provisions or records paid orders |
| `ORDER_FULFILLMENT_WEBHOOK_SECRET` | HMAC key shared with the fulfillment endpoint |

## Required Client Variables

| Variable | Purpose |
| --- | --- |
| `VITE_APP_URL` | Canonical production URL used by SEO metadata |
| `VITE_GA_MEASUREMENT_ID` | Optional GA4 measurement ID |
| `VITE_API_URL` | Optional separate API origin; leave unset for same-origin Vercel functions |

Never expose Redis, Stripe, EmailJS private, rate-limit, or fulfillment secrets with a `VITE_` prefix.

## Verification

Before promoting a deployment:

```bash
cd react-app
npm ci
npm run lint
npm run test:coverage -- --run
npm run build
```

Then verify a contact submission, a Stripe test purchase, webhook fulfillment, and duplicate webhook delivery in the deployed preview environment.
