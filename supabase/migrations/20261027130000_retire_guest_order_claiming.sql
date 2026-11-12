-- Checkout now requires a signed-in account with a confirmed email, and every
-- order is bound to that account through Stripe metadata. Matching unclaimed
-- orders to accounts by email is no longer needed.
drop function if exists public.claim_verified_orders(uuid, text);
drop index if exists public.orders_email_unclaimed_idx;
drop index if exists public.orders_unclaimed_email_idx;
