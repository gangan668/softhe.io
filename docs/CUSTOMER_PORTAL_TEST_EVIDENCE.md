# Customer portal Preview test evidence

Verified on 2026-07-27 (Europe/Berlin) against branch `customer-portal-test`.
No passwords, tokens, private keys, customer message bodies, or service credentials are
recorded in this document.

## Deployment

- Branch alias: `https://softhe-io-git-customer-portal-test-suportsofthe-9420s-projects.vercel.app`
- Verified deployment: `https://softhe-izig7wiem-suportsofthe-9420s-projects.vercel.app`
- `/api/health`: HTTP 200, status `ready`; checkout, contact, tickets, withdrawal,
  storage, and fulfillment checks all `true`.
- Production storefront: checkout remains disabled. The live Store shows
  “Online checkout is being prepared” and exposes no Add to cart button.

## Customer authentication

- Two dedicated customer accounts and one staff account were created and email-confirmed.
- Valid login, logout, rejected stale refresh token, invalid credentials, and re-login
  were verified.
- Password recovery email was delivered and its recovery token was used successfully.
- The password update returned HTTP 200; the previous password then returned HTTP 400,
  while the replacement password returned HTTP 200.

## Row Level Security

- Anonymous access returned no customer data.
- Customer 1 could not read customer 2’s profile, orders, tickets, ticket messages,
  activity events, or roles, and customer 2 could not read customer 1’s records.
- Role escalation and customer mutation of order history were rejected.
- After customer 2 claimed a guest order, customer 1 received zero rows when querying
  that Checkout Session.

## Staff portal

- Staff bootstrap persisted the authorized role for the configured allowlisted account.
- `/admin` loaded customer, order, and ticket views.
- A ticket was moved to `in_progress`; a staff reply persisted and its notification
  endpoint succeeded.
- Missing notification configuration fails closed and is surfaced by the account/admin UI.

## EmailJS

- Strict Mode private-key authentication is required by health checks and stored only as
  a sensitive, branch-scoped Preview variable.
- Ticket notification returned `{"notified":true}`.
- EmailJS history recorded Gmail result `OK` at 00:50:38.
- Paid-order confirmation recorded Gmail result `OK` at 01:09:07 and arrived in the
  destination Proton mailbox.

## Stripe and fulfillment matrix

- Authenticated Checkout Session
  `cs_test_b1SzaKKxU7DMyc4d9qmGOWXJzAt81xGb24s6Pz8Ta62tEcrqIZgMnIqcN1`
  completed as paid for EUR 75.00 and was linked to customer 1.
- Guest Checkout Session
  `cs_test_b1JApuceHTLeJmjn3ZvJx9S8ylyIKxNn0Yq0A1xw4T26GZF9ivIiTyxZZn`
  completed as paid for EUR 50.00. Portal bootstrap claimed exactly one matching order
  for customer 2.
- Stable authenticated Checkout Session
  `cs_test_b1iiTf1MAYAKdBSNiRd7huBKlkzid8IRcUZj3hezYqXcZv0SGpaDmmKjWZ`
  completed as paid for EUR 50.00. The customer could read one paid order, one order
  item, and one `order.paid` activity event for it.
- Signed webhook event `evt_1TxazO2EodKilmfKJ5dRbOEq` persisted its order and item once
  while fulfillment/email failures returned HTTP 503 for Stripe retry.
- Signed webhook event `evt_1Txb6G2EodKilmfKk6F4V45u` exercised the receiver’s
  intentional first-attempt HTTP 503 behavior.
- After fault injection was disabled, the stable paid event completed the Stripe webhook
  and fulfillment receiver on the first pass, and the confirmation email returned `OK`.
- Duplicate webhook/order persistence is constrained by the Checkout Session and event
  idempotency records; retry testing produced one order, one item, and one activity event.

## Preview-only limitation

Vercel Deployment Protection intercepts the browser redirect to the protected Preview
success URL and asks for Vercel authentication. This does not prevent Stripe payment,
signed webhook delivery, order persistence, fulfillment, or confirmation email. Do not
disable Preview protection merely to bypass this screen.
