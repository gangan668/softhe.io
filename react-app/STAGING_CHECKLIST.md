# Preview promotion checklist

Use the Vercel Preview deployment for every item. A local build is useful evidence but is not a substitute for validating the deployed serverless environment.

## Automated gates

- [ ] Production dependency audit reports zero high-severity vulnerabilities.
- [ ] Lint and the ≥80% unit-coverage gate pass.
- [ ] Strict production build and initial asset budget pass.
- [ ] Isolated desktop/mobile Playwright tests pass and confirm the Softhe.io marker.
- [ ] Production smoke passes against Preview, including `/api/health`, security headers, route metadata, withdrawal, and a true 404.

## Transactional gates

- [ ] Contact delivery, rate limiting, spam handling, and failure messages are verified.
- [ ] A withdrawal request creates an Upstash record and sends both timestamped customer and operator messages.
- [ ] A Stripe test order records consent metadata and reaches the real fulfillment receiver.
- [ ] Asynchronous payment, duplicate webhook, email failure, and fulfillment retry behavior are verified.
- [ ] The order confirmation contains items, total, VAT treatment, seller identity, terms, withdrawal instructions, support, and fulfillment state.

## Manual review

- [ ] Legal identity, VAT presentation, prices, delivery timing, compatibility, complaints, and withdrawal language match counsel-approved values.
- [ ] Home, store, checkout, contact, withdrawal, legal, benchmark, cart, menu, cookie dialog, guides, and 404 pages are reviewed at 320, 390, 768, 1280, and 1440 pixels.
- [ ] Keyboard navigation, focus restoration, browser console, network failures, and error ingestion are reviewed.
- [ ] Benchmark configuration identifies the exact setup, at least three repeated runs, median aggregation, raw evidence, FPS, and 1% lows.

## Promotion decision

Keep `VITE_COMMERCE_ENABLED=false` until every commercial launch blocker in `../docs/COMMERCIAL_LAUNCH_CHECKLIST.md` has evidence. Record the last known-good Vercel deployment and DNS rollback target before promotion.
