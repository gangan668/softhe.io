# Processing monitor isolation and activation

On 2026-10-08, the authorized implementation provisioned distinct Production and isolated Preview reconciliation tokens to their matching Vercel scopes and GitHub secrets. Token values were not logged. PROCESSING_MONITORING_ENABLED remains false pending qualification of fresh deployments. This document does not claim successful deployed reconciliation or receipt of alerts.

| Environment | GitHub Actions secret | Vercel runtime variable | Vercel scope |
|---|---|---|---|
| Production | MONITORING_RECONCILIATION_SECRET | MONITORING_RECONCILIATION_SECRET | Production only |
| Isolated Preview | MONITORING_PREVIEW_RECONCILIATION_SECRET | MONITORING_RECONCILIATION_SECRET | Preview, exact monitored branch only |

Generate values independently through the existing authorized local credential flow. GitHub secret setting receives values on stdin. Vercel receives them through authenticated request bodies. Keep values out of model-visible outputs, command arguments, logs, files exposed to artifacts and step summaries. No extra credential, PAT or provisioning workflow is required. Root owns actual provisioning and provider settings.

The Preview query never falls back to the Production token. A configured Preview URL requires its separate token of at least 32 characters and an explicit matching branch. The response checker rejects old generic health replies lacking reconciliation counts. The older Preview that predates this endpoint is not a compatible target.

Scheduled reconciliation runs only when PROCESSING_MONITORING_ENABLED=true. Keep it unset or false during provisioning and qualification. Manual dispatch runs fail-closed configuration checks before activation. Merge alone must not enable an unqualified monitor. The existing runtime alert monitor continues independently.

## Deployment and activation order

1. Provision the independently generated values to GitHub and their exact Vercel scopes through the approved secure flow.
2. Deploy compatible source to the intended Production candidate and isolated Preview branch. Environment changes require fresh deployments; a reachable old Preview is insufficient.
3. Check deployed source identities and verify that Preview uses isolated test-only providers. Update MONITOR_BASE_URL and MONITOR_PREVIEW_BRANCH together after checking deployment metadata.
4. Manually dispatch reconciliation. Both configured targets must return valid count-bearing replies, no pending attempts and no truncation. Malformed, unauthorized or unavailable replies fail visibly.
5. Activate scheduling only after the compatible Production target is live and manual proof passes. Save deployment IDs, commits and exact workflow run URL in evidence.

## Stripe and fulfillment alert receipt qualification

Run monitoring-alerts.yml controlled Stripe and fulfillment cases separately against the compatible isolated Preview. Production fault injection remains refused by the API. Record each exact GitHub run URL, successful Production health check, successful Preview event emission, matching runtime marker and expected alert-evaluation failure. Failure at configuration or event emission is not detection evidence. The checker requires the requested marker even if another event shares its log window.

For each expected failure, inspect the intended notification mailbox or GitHub notification and confirm that the received message links to that exact run. Record channel, receipt time and run link without credentials. Synthetic markers prove detection, and actual receipts prove delivery; neither substitutes for a real signed test payment or fulfillment failure. Real provider qualification records test-mode request/session IDs, the emitted failure marker, safe retry/completion and absence of duplicate delivery. The provider qualification owner handles those mutations. Do not mark launch evidence passed from source tests or expected workflow failure alone.
