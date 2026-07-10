# Serverless API

This folder contains the production payment boundary for a Vercel-compatible deployment.

## create-checkout-session.js

Creates a Stripe Checkout Session without exposing secret keys or authoritative prices to the React client. Product IDs and quantities are validated, duplicate products are merged, quantities are capped, and the 5%/10% bundle discount is applied to server-owned prices.

## stripe-webhook.js

Verifies Stripe's signed raw webhook payload and handles completed or expired Checkout Sessions. Configure the Stripe endpoint as `/api/stripe-webhook` and subscribe to:

- `checkout.session.completed`
- `checkout.session.expired`

Required environment variables:

- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- PUBLIC_SITE_URL, optional fallback origin

The React client optionally accepts `VITE_API_URL` when the API is hosted on another origin. Leave it unset when the site and functions share a Vercel deployment.

GitHub Pages cannot run these functions. Deploy through the root `vercel.json` (or an equivalent Node serverless host) before enabling production checkout.
