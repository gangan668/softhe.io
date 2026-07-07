# Serverless API

This folder contains deployment-target examples for hosts that support Node serverless functions, such as Vercel-compatible deployments.

## create-checkout-session.js

Creates a Stripe Checkout Session without exposing secret keys to the React client.

Required environment variables:

- STRIPE_SECRET_KEY
- PUBLIC_SITE_URL, optional fallback origin

The current GitHub Pages deployment cannot run this endpoint. Keep manual bundle invoicing active unless the site is deployed on a host with serverless function support.
