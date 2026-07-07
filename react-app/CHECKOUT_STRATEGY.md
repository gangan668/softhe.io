# Checkout Strategy

Softhe.io currently uses a static-site checkout model.

## Current behavior

- Single products send customers to hosted Stripe payment links.
- Multi-product carts show an invoice total and explain that bundle discounts require manual confirmation.
- Customers can still pay for individual products from the checkout page.
- Discounted bundle payment should be handled through support until a backend checkout service exists.

## Why this is intentional

A static React deployment cannot securely create combined Stripe Checkout Sessions because that requires server-side secret keys. Keeping bundle checkout manual avoids exposing secrets in the client and avoids implying that automatic bundle payment exists.

## Upgrade path

1. Add a serverless endpoint for Stripe Checkout Session creation.
2. Move product and discount calculation to the server.
3. Validate cart item IDs and prices server-side.
4. Return a single Stripe Checkout URL for multi-product carts.
5. Add webhook handling for paid, failed, and refunded orders.

Until then, the production UI should keep the manual invoice language.
