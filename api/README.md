# Serverless API

This folder contains the production checkout, contact, withdrawal, rate-limit, and fulfillment boundaries for a Vercel-compatible deployment.

## contact.js

Validates contact submissions, pseudonymizes the caller address, enforces a durable three-per-minute limit through Upstash Redis, and sends through EmailJS without exposing EmailJS configuration to the browser.

## create-checkout-session.js

Creates a Stripe Checkout Session without exposing secret keys or authoritative prices to the React client. Product IDs and quantities are validated, duplicate products are merged, quantities are capped, and the 5%/10% bundle discount is applied to server-owned prices. Terms acceptance, the early-performance request, and the withdrawal acknowledgement are required and versioned in Stripe metadata.

## withdrawal.js

Accepts an order reference, purchaser email, requested items, and optional comments. Requests are rate-limited and idempotent in Upstash, retained as timestamped records, and acknowledged to the customer through EmailJS while a separate operator notification is sent. Configure a durable customer template and operator-notification template; do not point both at an operator-only address.

## stripe-webhook.js

Verifies Stripe's signed raw webhook payload, durably deduplicates paid sessions, signs delivery to the configured fulfillment endpoint, and sends the durable order confirmation. Configure `/api/stripe-webhook` and subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.expired`

Required environment variables:

- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- PUBLIC_SITE_URL
- LEGAL_NAME
- LEGAL_ADDRESS
- BUSINESS_REGISTRATION_ID
- VAT_STATUS (`registered`, `not-registered`, or `exempt`)
- VAT_ID, required when `VAT_STATUS=registered`
- SUPPORT_EMAIL
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN
- CONTACT_RATE_LIMIT_SECRET
- EMAILJS_SERVICE_ID
- EMAILJS_TEMPLATE_ID
- EMAILJS_TICKET_TEMPLATE_ID
- EMAILJS_ORDER_TEMPLATE_ID
- ORDER_CONFIRMATION_PROVIDER, optional; set to `resend` only after configuring and verifying `RESEND_API_KEY` and `EMAIL_FROM` (defaults to EmailJS)
- RESEND_API_KEY and EMAIL_FROM, required for the opt-in Resend order-confirmation path
- EMAILJS_WITHDRAWAL_TEMPLATE_ID
- EMAILJS_WITHDRAWAL_NOTIFICATION_TEMPLATE_ID
- EMAILJS_PUBLIC_KEY
- EMAILJS_PRIVATE_KEY, required for server-side EmailJS Strict Mode
- WITHDRAWAL_RETENTION_DAYS, optional; defaults to 400 and is clamped to 30–730
- EXTERNAL_REQUEST_TIMEOUT_MS, optional; defaults to 8000 and is clamped to 1000–30000
- ORDER_FULFILLMENT_WEBHOOK_URL
- ORDER_FULFILLMENT_WEBHOOK_SECRET

EmailJS confirmation attempts are never retried automatically after an uncertain result because EmailJS has no idempotency key. The opt-in Resend path uses the Stripe Checkout Session ID as a stable idempotency key and permits retries for 23 hours after the first attempt. Older uncertain attempts and Resend idempotency conflicts require manual review; do not switch providers while one is pending. A review record is retained in Redis under `stripe:fulfilled:<session-id>:confirmation-review` for 400 days. It contains the session ID, reason, and creation time, but no customer address. The monitoring workflow queries the `stripe_confirmation_requires_review` log event. Resend's key-retention window is 24 hours. Keep commerce disabled until the sender domain, delivery, and launch evidence have been verified in Preview.

## /api/order-fulfillment

This public route is internally rewritten to the shared `stripe-webhook.js` function so the
deployment remains within Vercel's Hobby function limit. It accepts the HMAC-signed paid-order
payload emitted by `stripe-webhook.js`, enforces the Checkout
Session idempotency key, and stores one durable order record in Upstash Redis. Duplicate Stripe
deliveries return success without creating another record. `ORDER_RETENTION_DAYS` controls record
retention and defaults to 400 days (allowed range: 30–730). Production should configure
`ORDER_FULFILLMENT_WEBHOOK_URL` as the HTTPS `/api/order-fulfillment` route on the immutable
candidate origin and use the same `ORDER_FULFILLMENT_WEBHOOK_SECRET` for sender and receiver.

## health.js and browser-errors.js

`GET /api/health` reports whether every required production integration is configured without exposing secret values. Use it as the cutover and uptime readiness check.

`POST /api/browser-errors` accepts bounded, rate-limited client error reports and writes structured records to server logs. Configure `VITE_ERROR_REPORTING_ENDPOINT=/api/browser-errors` on the serverless deployment, then connect the host logs to the chosen alerting destination.

`PUBLIC_SITE_URL` is the only source used for Stripe success and cancellation URLs. Request host headers are intentionally ignored.

The React client optionally accepts `VITE_API_URL` when the API is hosted on another origin. Leave it unset when the site and functions share a Vercel deployment.

GitHub Pages cannot run these functions. Deploy through the root `vercel.json` (or an equivalent Node serverless host) before enabling production checkout.

## Durable processing reconciliation

`GET /api/health?action=reconcile-processing` requires a separate `MONITORING_RECONCILIATION_SECRET` of at least 32 characters. It reconciles at most 100 retained processing records in one atomic Redis operation, then returns counts and readiness flags. It never returns customer data, session identifiers or secrets. It does not replay payments, send email or retry delivery. A full scan, unfinished attempt older than 15 minutes, storage failure or invalid response fails the scheduled monitoring check.

Stripe fulfillment and the signed fulfillment receiver register processing before work begins. A sorted index preserves the earliest unresolved start across retries, and a hash holds the latest attempt token. Completion can clear only its matching token. The reconciliation operation also recognizes the existing complete Stripe or receiver-order stage, clearing an index left behind if a process terminated after committing completion. Both index keys retain data for 400 days after the latest registered attempt. New records contain only kind, session identifier and random attempt token. Processing failures and confirmation-review cases retain their entry until successful completion or authorized operator investigation. This tracks attempts initiated by the updated release; it does not reconstruct earlier historical attempts.

Before deploying `.github/workflows/processing-reconciliation.yml`, the owner must provision the same new independent secret in GitHub Actions, Vercel Production and any monitored Preview environment. Do not reuse `MONITORING_TEST_SECRET`, which controls Preview fault injection. No secret was generated or installed during source repair. The workflow queries Production and, when `MONITOR_BASE_URL` is explicitly configured, the protected Preview deployment. Missing configuration fails visibly. Actual scheduled execution and delivered GitHub/email notification still need deployment-specific evidence.

Source regression tests cover authorization, unavailable storage and alert outcomes. For real Redis Lua verification, use a disposable Redis container on code1 with no exposed port or persistent volume and a name beginning `softhe-processing-test-`. From `react-app`, set `PROCESSING_REDIS_TEST_CONTAINER` to that exact name and run `node scripts/test-processing-index.js`. The script refuses arbitrary container names and flushes only the named disposable database. Remove the container afterward. The 2026-10-07 disposable run passed nine durability, expiry, retry, completion and bounded-scan cases; see `docs/audits/2026-10-07/processing-index-redis-proof.json`. This is local integration evidence, not a production alert-delivery proof.
