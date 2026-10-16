# Analytics privacy

The website uses Vercel Web Analytics only after optional analytics consent. The application submits fixed public page views through its `beforeSend` filter, removes URL query strings and fragments, and rejects authentication, account, staff, checkout, and unknown routes. The filter reads the current consent and current route for every event, including events from a script that was loaded before a route change or consent withdrawal.

Google Analytics is retired. `VITE_GA_MEASUREMENT_ID` is ignored, the website does not load the Google Analytics script, and legacy analytics helper exports are inert. Store, cart, and checkout callers cannot send custom events, purchases, customer properties, or form values through those helpers. The compatibility exports remain so their callers can be removed separately without changing business behavior.

FAQ search metadata contains only a bounded query length and a fixed category identifier. It does not contain the search text. The compatibility tracking helper currently discards that metadata along with all other custom events.

Consent changes update the local `softhe_analytics_consent` setting and notify the active page. Withdrawing or clearing consent makes the installed Vercel event filter reject subsequent events. The browser tests initialize analytics on a public route, navigate to private routes, withdraw consent, and explicitly exercise the already-loaded collector. They intercept all collector requests locally and assert that no Google Analytics request occurs even with a legacy measurement ID configured.

The portal browser tests use intercepted authentication and database responses and the installed Supabase SDK's cross-tab session notification. They verify that replacing a user discards MFA QR codes, authenticator inputs, and drafts, and that a pending staff reply cannot restore the previous conversation after the identity changes. These tests do not contact a live Supabase project or analytics provider.
