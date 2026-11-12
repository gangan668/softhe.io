# Website completion plan

Prepared 2026-10-07 from the main-branch audit at `77aead61515245e553efdda15fdaf4973b7e462a` and a review of the current source, release workflows, and launch checklist.

The plan covers every audit finding, fresh provider verification, the six pending commercial evidence items, and deployment documentation. The owner subsequently requested execution; progress and evidence boundaries are recorded in `EXECUTION_STATUS.md`. The owner specifically authorized restoring the existing isolated Supabase project and temporary synthetic customers with cleanup. Production promotion and commerce activation remain separate release decisions.

## Release milestones

1. Correct and qualify the website while production ordering remains disabled.
2. Complete commercial qualification in an isolated environment using test-mode payments.
3. Open production ordering only after the full commercial gate passes and the owner approves that release.

The first milestone does not depend on obtaining legal approval for a commercial launch. Contact and staff access have independent controls and must not be enabled merely because checkout qualification passes.

## Phase 1: Establish the current release and test environment

- Recheck remote main, the working tree, current production deployment ID, public origin, source commit, fingerprint, feature flags, and scheduled workflow variables.
- Work on `codex/website-audit-remediation`, preserving the existing audit artifacts and unrelated changes.
- Identify a protected Preview and its actual Supabase project, synthetic mailboxes, Stripe test mode, Redis namespace, and fulfillment receiver. Verify isolation before any test mutation.
- Inventory access using status-only checks. Reuse existing test identities and scoped credentials where available. Never request secrets in chat or copy Production secrets into Preview to make health pass.
- Record the existing healthy deployment as the rollback candidate. Inspect actual DNS records; do not assume a DNS cutover is necessary because old documentation says so.

Exit condition: a documented production baseline, verified test-environment mapping, known rollback target, and a list of the few remaining access requirements.

## Phase 2: Implement the source repairs

These workstreams can run concurrently in separate files. Integration and final validation remain sequential.

### A. Public origin and route metadata

- Give static metadata, hydrated metadata, sitemap/social URLs, and auth callbacks a shared validated origin configuration.
- Use `https://softhe.io` for Production. Keep provider test callbacks within the explicitly approved isolated test origin.
- Apply a private-route metadata policy to login, registration, forgot-password, resend-confirmation, reset-password, account, and admin, including loading/error/redirect states.
- Restore public metadata when navigating back from private routes.

Acceptance: static HTML, hydrated direct loads, and public/private SPA navigation agree on canonical URLs; private routes stay `noindex, nofollow`; auth confirmation/recovery destinations match the intended environment.

### B. Authentication initialization and recovery

- Handle failed SDK loading and failed or error-returning session initialization; settle loading and offer a clear retry path.
- Clear the cached rejected SDK promise so retry can actually recover.
- Guard asynchronous updates after unmount and dispose subscriptions created after cleanup.
- Reset stale staff state on account changes and sign-out. Verify Strict Mode behavior.
- Check rejected recovery verification and submission paths for recoverable UI states rather than indefinite loading or unhandled promises.

Acceptance: import/session failure, retry success, delayed initialization, user switching, sign-out, and unmount scenarios pass behavior tests. Private pages never wait indefinitely and no late subscription survives cleanup.

### C. Rate-limit timers

- Clear countdown and unblock timers on unmount and reset.
- Replace the three skipped timer tests with deterministic fake-clock tests.
- Cover exact window expiry, countdown updates, custom limits, retry after unblock, and reset while blocked.

Acceptance: all timer regressions run; behavior matches the configured limits; reset/unmount leaves no pending timers.

### D. Production 404 compatibility

- Move the static 404 styles to a same-origin stylesheet.
- Retain the current restrictive production CSP.
- Strengthen the unknown-route test to check the actual not-found content and correct deployed status/style behavior.

Acceptance: unknown URLs return HTTP 404, show the intended layout under production CSP, and provide a working home link.

### E. Dependency repair

- Update only the affected `source-map-js` lockfile resolution to a compatible patched version, currently 1.2.2 or later after rechecking the advisory.
- Avoid unrelated dependency upgrades.

Acceptance: clean `npm ci`, audit, lint, coverage, and strict builds pass; the lockfile diff contains only intended dependency changes.

### F. Performance measurement

- Traverse the build manifest/import graph and include startup dynamic dependencies for configured authentication.
- Report anonymous/public, auth-startup, and authenticated scenarios separately, deduplicating shared assets.
- Decide whether to defer auth initialization on public pages or reduce its cost based on measured behavior. Do not simply raise the existing budget to hide the omission.
- Capture repeatable desktop/mobile lab performance and compare against the audit build. Record that lab results are separate from field Core Web Vitals.

Acceptance: budget tests fail on a deliberately oversized transitive/startup dependency, pass for the final build, and match the observed resource-loading scenarios.

### G. Benchmark publication

- Download the linked evidence archive as a research artifact, verify SHA-256, inspect its four captures, and recompute the published medians.
- Link the verified archive from the benchmark page and derive publication status from a single evidence source.
- Correct stale publication copy on home, store, and performance pages.
- Preserve the multi-variable comparison warning. Do not invent the missing exact game-build identifier or claim the result isolates one product.

Acceptance: checksum and manifest arithmetic agree, links work, website copy matches the available evidence, and unresolved methodological limits remain explicit. If verification fails, retain the warning and record the failure rather than claiming publication is complete.

## Phase 3: Close test gaps and run the full local gate

- Add behavioral unit/integration tests for AuthProvider, ProtectedRoute, AuthPage, ResetPassword, Account, Admin, and App routing/callback handling.
- Cover profile persistence, orders/history, ticket creation/reply, duplicate submissions, invalid sessions, customer/staff denial, MFA states, revoked access, and recoverable API/provider errors.
- Add deterministic browser tests for authenticated flows using an isolated mocked provider. Keep those distinct from provider-backed verification.
- Check all named pages at 320, 390, 768, 1280, and 1440px, including keyboard navigation, dialogs, form errors, consent changes, metadata transitions, and unknown routes.
- Report focused gate coverage and a separate whole-source inventory. Add meaningful regression coverage instead of hiding uncovered files or choosing an arbitrary percentage.
- Run clean install, high-severity audit, lint, focused coverage, whole-source inventory, enabled/disabled strict builds, secret scan, corrected performance budgets, both browser profiles, benchmark verification, and diff checks.

Exit condition: every source finding has an implementation, a matching regression check, and a recorded result. The commercial evidence gate may still be pending at this milestone.

## Phase 4: Qualify a deployed candidate with Computer Use

- Prepare the reviewed changes and PR. Obtain authorization for external publication when needed; main has automatic production deployment, so merge is a production action.
- Build a protected immutable candidate with ordering and staff disabled. The existing staged-production workflow is suitable for this milestone because it explicitly forces those flags off.
- Bind the candidate origin, deployment ID, commit, and fresh release fingerprint. Run strict smoke against that identity.
- Use Computer Use for visual route checks, responsive layouts, keyboard focus, FAQ/store/contact states, auth callback destinations, private metadata, and styled 404 verification.
- Inspect same-origin assets and browser errors. Classify external CAPTCHA/browser failures separately from application defects; do not suppress them to make results appear clean.

Exit condition: a reviewable, technically qualified corrected release with ordering still disabled and a verified rollback target.

## Phase 5: Fresh provider-backed verification in isolation

### Customer portal and access controls

- Use two synthetic customers and existing explicitly authorized staff/admin test identities.
- Verify confirmation, login/logout, newest and expired recovery links, profile changes, orders/history, ticket creation/reply, and actual notification receipts.
- Verify staff AAL2 requirements, reply/status operations, admin-only views, grant expiry/revocation, and suspended/stale sessions.
- Inspect current migrations, grants, and RLS. Test own-record access, cross-customer denial, forged ownership, self-role escalation, and anonymous denial. Verify audited staff server access without granting broad direct browser access.
- Plan disposal/reversal of synthetic data and temporary grants before mutation; clean up and verify it afterward.

### Contact and withdrawal

- Verify successful delivery, actual inbox receipts, spam/CAPTCHA behavior, validation, rate limiting, provider failure messages, duplicate handling, acknowledgements, operator notification, and intended record retention.
- Keep the Production contact flag disabled until its independent checks and release decision pass.

### Payments, durable records, and fulfillment

- Create a protected test-mode commerce candidate using isolated provider resources. The existing staged-production path cannot serve this purpose because it forces commerce off; use a separate reviewed deployment configuration.
- Exercise successful checkout, cancellation, session/receipt verification, cart clearing/retention, and customer/order association.
- Deliver the same signed webhook twice and prove one logical order/fulfillment outcome.
- Exercise an asynchronous-payment event; reconcile Stripe, durable idempotency records, order state, fulfillment, and email state.
- Inject a controlled fulfillment failure in the isolated environment, retry it, and verify eventual reconciliation and no duplicate accepted order.
- Inspect confirmation email contents: items, total/currency, VAT treatment, terms, withdrawal link, support, and fulfillment status.
- Test ambiguous email delivery and manual-review behavior without claiming exactly-once delivery where the provider cannot guarantee it.

Acceptance: redacted provider IDs, timestamps, candidate identity, retained record/TTL evidence, and actual receipts establish each successful and failed/retried flow. Health and mocked responses do not count as provider proof.

## Phase 6: Complete monitoring and commercial evidence

- Review and implement explicit Stripe-webhook and fulfillment failure/stuck-processing alert detection. Current monitoring covers uptime, browser errors, delivery failures, and confirmation reviews; the two missing alert categories need a real detection path before testing them.
- Add deterministic log-parser/alert tests and protected test-only triggers, without exposing fault injection on Production.
- Trigger each missing alert through a controlled failure on the isolated candidate. Verify the received notification links to the exact workflow run and correlate it with the provider/runtime event.
- Recheck release-relevant existing alert paths and credential validity. Record synthetic alert proof separately from actual provider failure proof.
- Obtain or locate Swedish counsel and accounting approval for the final legal pages, withdrawal flow, checkout consent, price/VAT treatment, receipts, and complaints path. Prepare the exact review package; never substitute a technical test for human approval.
- Complete the six pending manifest entries only after evidence exists: counsel approval, accounting approval, Stripe idempotency record, asynchronous payment event, Stripe webhook alert, and fulfillment alert.
- Refresh evidence relevant to the new candidate. Do not relabel historical evidence as fresh, or assume an old manifest candidate qualifies a new deployment.

Exit condition: every required commercial item is backed by an identifiable verifier, timestamp, and evidence reference, and the full evidence verifier passes for the exact candidate.

## Phase 7: Refresh operational records and release

- Reconcile READINESS_STATUS, ROLLBACK, STAGED_PRODUCTION_RUNBOOK, DEPLOYMENT, the launch checklist, and evidence manifests with the verified current state. Preserve older records as dated history.
- Replace obsolete claims that current production is GitHub Pages. Record the actual healthy Vercel rollback deployment and current DNS/provider export when required.
- Rehearse rollback on a protected test alias, then restore it and verify both states. Do not move the public domain solely to exercise rollback.
- Run the appropriate stage-one or commerce release gate against the exact immutable origin/commit/fingerprint. A gate pass qualifies the candidate; it does not itself authorize promotion.
- Present the qualified release, final flags, test evidence, and rollback instructions for the owner's production decision.
- After authorized promotion, verify the custom domain, release identity, health, headers, metadata, all critical browser paths, and monitoring expectations. Align scheduled smoke identity variables with the approved release.
- If commercial launch is authorized, verify the final commerce-enabled artifact/configuration as part of qualification rather than changing flags after validating a different artifact. Confirm live Stripe mode and run the separately authorized payment smoke.
- On regression, restore the verified healthy deployment and disable affected commerce/contact features; record the recovery and verification.

Exit condition: the requested release milestone is live, verified, documented, and recoverable. Commercial completion additionally requires the owner-approved activation and successful provider-backed launch verification.

## Execution responsibilities and input

Use separate sub-agents for metadata/404, auth/timers/tests, and dependency/performance/benchmark work. Each owns distinct files and supplies a finding-to-change-to-test record. The primary agent integrates the changes and performs the complete gate. Provider mutations and shared browser sessions remain serialized.

The owner needs to specify whether the intended endpoint is the corrected disabled release or commercial activation, identify existing disposable test accounts/mailboxes, and locate any already obtained legal/accounting approvals. Interactive access may be needed for CAPTCHA, MFA, password changes, and notification receipt inspection. New persistent identities, credentials, or temporary privileged grants need specific authorization if existing access is insufficient. No plaintext secrets should be supplied in chat.

Completion tracking should record each item as planned, implemented, locally verified, candidate verified, or production verified, with evidence links. A source patch is not a live fix, and a synthetic notification is not a real provider transaction.
