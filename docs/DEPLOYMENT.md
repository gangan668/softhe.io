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
7. Leave the existing production DNS unchanged while validating the Vercel preview and assigned Vercel domain. Record the last known-good deployment URL before moving DNS.

## Required Server Variables

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | Trusted origin for Stripe success and cancellation URLs |
| `LEGAL_NAME` | Registered seller/controller name used in durable email records |
| `LEGAL_ADDRESS` | Registered postal address used in durable email records |
| `BUSINESS_REGISTRATION_ID` | Swedish organisation number used in durable email records |
| `VAT_STATUS` | `registered`, `not-registered`, or `exempt`; registered checkout enables Stripe automatic tax with VAT-inclusive prices |
| `VAT_ID` | Swedish VAT number, required when `VAT_STATUS=registered` |
| `SUPPORT_EMAIL` | Support address placed in transactional messages |
| `STRIPE_SECRET_KEY` | Creates Stripe Checkout Sessions |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures |
| `UPSTASH_REDIS_REST_URL` | Durable rate-limit and fulfillment state |
| `UPSTASH_REDIS_REST_TOKEN` | Server-only Redis write token |
| `CONTACT_RATE_LIMIT_SECRET` | HMAC key used to pseudonymize contact-form IP addresses |
| `EMAILJS_SERVICE_ID` | EmailJS service used by the server function |
| `EMAILJS_TEMPLATE_ID` | EmailJS contact template |
| `EMAILJS_ORDER_TEMPLATE_ID` | Durable customer order-confirmation template |
| `EMAILJS_WITHDRAWAL_TEMPLATE_ID` | Timestamped customer withdrawal acknowledgement |
| `EMAILJS_WITHDRAWAL_NOTIFICATION_TEMPLATE_ID` | Operator withdrawal notification |
| `EMAILJS_PUBLIC_KEY` | EmailJS account public key |
| `EMAILJS_PRIVATE_KEY` | Optional EmailJS private key |
| `WITHDRAWAL_RETENTION_DAYS` | Optional withdrawal-record retention, default 400 days |
| `EXTERNAL_REQUEST_TIMEOUT_MS` | Optional outbound API timeout, default 8000 ms and clamped to 1000–30000 ms |
| `ORDER_FULFILLMENT_WEBHOOK_URL` | HTTPS endpoint that provisions or records paid orders |
| `ORDER_FULFILLMENT_WEBHOOK_SECRET` | HMAC key shared with the fulfillment endpoint |

## Required Client Variables

| Variable | Purpose |
| --- | --- |
| `VITE_APP_URL` | Canonical production URL used by SEO metadata |
| `VITE_GA_MEASUREMENT_ID` | Optional GA4 measurement ID |
| `VITE_API_URL` | Optional separate API origin; leave unset for same-origin Vercel functions |
| `VITE_ERROR_REPORTING_ENDPOINT` | Optional same-origin or CSP-approved HTTPS JSON error collector |
| `VITE_LEGAL_NAME` | Public legal name of the service operator/controller |
| `VITE_LEGAL_ADDRESS` | Public postal address required by the operator's jurisdiction |
| `VITE_VAT_ID` | VAT identifier when applicable |
| `VITE_BUSINESS_REGISTRATION_ID` | Public business registration identifier when applicable |
| `VITE_LEGAL_JURISDICTION` | Operator country and state/region |
| `VITE_VAT_STATUS` | `registered`, `not-registered`, or `exempt` |
| `VITE_SUPPORT_EMAIL` | Public support and privacy contact address |
| `VITE_EDITORIAL_RESPONSIBLE_NAME` | Person legally responsible for editorial content when required |
| `VITE_DISPUTE_AUTHORITY` | Competent dispute-resolution or supervisory body when required |
| `VITE_DISPUTE_AUTHORITY_URL` | Public URL for that body |
| `VITE_COMMERCE_ENABLED` | Set to `true` only after checkout, fulfillment, and legal readiness pass |
| `VITE_CONTACT_FORM_ENABLED` | Set to `true` only after contact delivery and rate limiting pass |
| `VITE_REQUIRE_PRODUCTION_CONFIG` | Set to `true` on the serverless production deployment to fail incomplete builds |
| `VITE_BENCHMARK_*` | Published hardware, software, scenario, capture date, repeated-run count, and `median` method |

Never expose Redis, Stripe, EmailJS private, rate-limit, or fulfillment secrets with a `VITE_` prefix.

## Verification

Before promoting a deployment:

```bash
cd react-app
npm ci
npm run lint
npm audit --audit-level=high
npm run test:coverage -- --run
npm run build
npm run budget
npm run e2e:all
```

Then verify all of the following in a deployed preview environment before moving the domain:

- route-specific title, description, canonical, Open Graph image, sitemap, and a true HTTP 404 for an unknown path;
- desktop and mobile navigation, keyboard focus, cart and cookie dialog focus trapping, and browser console errors;
- a contact submission and EmailJS receipt, including a rate-limit response;
- an online withdrawal submission, timestamped customer acknowledgement, operator notification, duplicate request, and retained Upstash record;
- a Stripe test purchase, checkout-session verification, success/cancel messaging, and cart retention/clearing behavior;
- signed fulfillment with authoritative product IDs and quantities, duplicate webhook delivery, and a retry/failure path;
- analytics consent and withdrawal, plus a deliberate test error arriving at the configured monitoring endpoint;
- the final legal name, postal address, VAT details, payment methods, refund wording, and service terms.
- `/api/health` returning HTTP 200 with every readiness check true and the production smoke workflow passing security-header and true-404 checks.

Record references, timestamps, and named verifiers in `docs/launch-evidence.json`. Once every
entry is backed by evidence, run `npm run evidence:verify` and dispatch the manual
**Commercial Release Gate** workflow with the exact candidate origin. The workflow binds the
manifest to the checked-out commit before it runs the strict production smoke.

## Promotion and rollback

The current rollback targets and DNS records are maintained in [`ROLLBACK.md`](ROLLBACK.md).

1. Obtain Swedish legal and accounting sign-off on the configured identity, VAT treatment, digital-content/service withdrawal wording, receipts, and complaints path.
2. Confirm the preview test order appears in Stripe, Upstash, the fulfillment receiver, and the customer mailbox.
3. Keep `VITE_COMMERCE_ENABLED=false` until the sign-offs and test order are recorded. Contact may be enabled independently after its delivery and abuse tests pass.
4. Promote the validated Vercel deployment, move DNS, and immediately run `npm run smoke:production` against the public origin.
5. If health, headers, routes, checkout, contact, or withdrawal regress, restore DNS to the prior target or promote the recorded last known-good Vercel deployment. Keep commerce disabled during rollback.

The GitHub Pages workflow is manual-only and retained as a static, commerce-disabled rollback artifact. It is not a healthy commercial production target because it cannot serve `/api/health` or any transactional function.

## Monitoring release gate

- Run the scheduled production smoke against `/api/health`; alert on any non-200 response or failed readiness check.
- Set the GitHub Actions variables `REQUIRE_APP_MARKER=true`, `REQUIRE_SECURITY_HEADERS=true`, and `REQUIRE_SERVERLESS_API=true` when the smoke target is a Vercel Preview or after the production cutover. Their temporary `false` defaults only keep the legacy GitHub Pages smoke useful before migration.
- Route Vercel structured errors to an alert destination and test browser-error ingestion before promotion.
- Alert on contact and withdrawal delivery failures, Stripe webhook non-2xx responses, fulfillment retries, and orders that remain in a processing state.
- Record a mobile and desktop Core Web Vitals baseline from the preview. Investigate LCP, INP, or CLS regressions before promotion.

Do not enable live Stripe mode until this checklist passes and the fulfillment receiver has recorded an end-to-end test order.
