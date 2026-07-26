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
- EMAILJS_WITHDRAWAL_TEMPLATE_ID
- EMAILJS_WITHDRAWAL_NOTIFICATION_TEMPLATE_ID
- EMAILJS_PUBLIC_KEY
- EMAILJS_PRIVATE_KEY, optional
- WITHDRAWAL_RETENTION_DAYS, optional; defaults to 400 and is clamped to 30–730
- EXTERNAL_REQUEST_TIMEOUT_MS, optional; defaults to 8000 and is clamped to 1000–30000
- ORDER_FULFILLMENT_WEBHOOK_URL
- ORDER_FULFILLMENT_WEBHOOK_SECRET

## health.js and browser-errors.js

`GET /api/health` reports whether every required production integration is configured without exposing secret values. Use it as the cutover and uptime readiness check.

`POST /api/browser-errors` accepts bounded, rate-limited client error reports and writes structured records to server logs. Configure `VITE_ERROR_REPORTING_ENDPOINT=/api/browser-errors` on the serverless deployment, then connect the host logs to the chosen alerting destination.

`PUBLIC_SITE_URL` is the only source used for Stripe success and cancellation URLs. Request host headers are intentionally ignored.

The React client optionally accepts `VITE_API_URL` when the API is hosted on another origin. Leave it unset when the site and functions share a Vercel deployment.

GitHub Pages cannot run these functions. Deploy through the root `vercel.json` (or an equivalent Node serverless host) before enabling production checkout.
