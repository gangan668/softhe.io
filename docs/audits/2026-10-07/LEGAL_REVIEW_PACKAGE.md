# Commercial review package

Prepared for the owner to locate or obtain Swedish counsel and accounting approval. This is an index of the actual implementation requiring review, not an approval or a legal conclusion. Bind the signed review to the final release commit and rendered configuration after integration.

## Counsel review

Review the rendered `/legal-notice`, `/privacy-policy`, `/terms`, and `/withdrawal` pages, their configured operator identity, and the full checkout consent flow. Source: `react-app/src/pages/LegalNotice.jsx`, `PrivacyPolicy.jsx`, `Terms.jsx`, `Withdrawal.jsx`, and `Checkout.jsx`; public identity configuration: `react-app/src/config/site.js`.

Confirm digital-content and service classification, withdrawal eligibility and early-performance consent, cancellation/refund handling, complaints route, Windows licensing statements, hardware-service limits, and controller/processor disclosures. Review the new consented Vercel Analytics disclosure against the final integration and provider settings. Check the actual withdrawal acknowledgement and operator notification templates, retention period, and recovery behavior.

## Accounting review

Current catalogue: Custom Windows 11 ISO EUR 75; Custom Windows 10 ISO EUR 65; BIOS Optimization Service EUR 50. Source: `react-app/src/data/products.js`. Checkout labels the total in EUR and states VAT treatment is shown on the receipt. Review configured registration/VAT status, inclusive price presentation, tax calculation, refund records, invoice/receipt identity, currency, and retention. Do not assume development or E2E identity/VAT fixtures are the final commercial configuration.

## Approval evidence required

For each reviewer, retain their identity/role, approval timestamp, exact commit and rendered configuration reviewed, scope, exceptions, and evidence location. Record actual counsel and accounting decisions in the two pending `docs/launch-evidence.json` entries only after they exist. Attach or reference the reviewed receipt and withdrawal email examples without customer data or credentials.

The user does not currently know where prior approval records or test inboxes are stored. None have been found in the repository or the inspected Vercel configuration. Production commerce remains disabled while these entries are pending.
