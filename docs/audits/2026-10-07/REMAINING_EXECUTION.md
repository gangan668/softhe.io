# Remaining release execution

The owner requested completion of the remaining work on 2026-10-08. The source checkpoint entering this work was `804111992c496bf19f233f6200b5b8e76529669c` on PR #9. Public Production remained `77aead61515245e553efdda15fdaf4973b7e462a`.

## Prepared technical work

- Provisioned separate cryptographically random reconciliation credentials to GitHub and Vercel Production and the exact isolated `customer-portal-test` Preview scope. Values were never logged or committed. Scheduled activation remains false until both fresh targets pass.
- Added a manual isolated-provider qualification mode to the existing release workflow. The runner validates immutable deployment metadata, exact project, branch and source before transmitting the existing monitoring test credential.
- Added independent server guards and seven real-provider stages covering temporary password sessions, profile ownership, tickets and replay, staff rejection, TOTP AAL2, temporary staff authorization and revocation, and suspension.
- Added durable run-owned recovery records and a cleanup reserve before starting provider mutations. The caller saves the run ID before execution. Recovery accepts only users and keys recorded in that isolated run journal.
- Kept Production fault injection unavailable and retained a separate activation switch for the scheduled reconciliation workflow.

This preparation does not claim a successful deployed Auth run, real customer email receipt, payment, fulfillment, or Production promotion. Append exact deployments and workflow results after they complete.

## Required external evidence

Legal/accounting approvals require the actual approvers and their records. An owner-accessible disposable inbox is required for confirmation/recovery and order email receipt. Protected visual review requires restoration of the expired Vercel browser session. The promotion runbook requires a current authoritative DNS-provider export and real CAPTCHA success/rejection evidence; a public resolver observation or an admin-confirmed synthetic user does not replace those checks.

Historical evidence in `launch-evidence.json` remains tied to its original observations. Do not change its dates or descriptions to imply fresh candidate verification. Commerce and staff remain disabled until their release evidence is complete.

## Deployed qualification findings

- Staged Production source `ddef194f8c697cd7be3a78171ae3077aad98cb15`, origin `https://softhe-cdveu1wvb-suportsofthe-9420s-projects.vercel.app`, passed the previous configuration-based health and strict smoke in [run 37829670143](https://github.com/gangan668/softhe.io/actions/runs/37829670143). That observation does not establish Redis connectivity.
- The compatible isolated Preview is `dpl_8FogG7w45aGTpPuZwdBYjDzKLhZZ`, origin `https://softhe-drvm0m8jq-suportsofthe-9420s-projects.vercel.app`, same source, exact `customer-portal-test` scope. [Provider run 37829764619](https://github.com/gangan668/softhe.io/actions/runs/37829764619) returned HTTP 503 before creating test customers. The isolated Redis hostname `many-bull-176063.upstash.io` independently failed DNS resolution. The owner was asked for Upstash access and authorization for a free isolated replacement if restoration is impossible.
- [Processing qualification run 37830644136](https://github.com/gangan668/softhe.io/actions/runs/37830644136) accepted the Production reconciliation credential but returned HTTP 503, `Processing monitoring is temporarily unavailable`. The storage operation failed; its specific upstream cause remains unverified. Do not infer that Production uses the same missing hostname as Preview.
- The generic health endpoint previously reported ready with only Redis configuration present. The subsequent source fix now requires an authenticated Redis PING/PONG and marks dependent checks unavailable on failure. Deploy and verify this corrected readiness check before promotion.
- [Stripe alert run 37830176614](https://github.com/gangan668/softhe.io/actions/runs/37830176614) passed public health, accepted the Preview trigger, then detected one Stripe webhook failure and failed alert evaluation as intended. [Fulfillment alert run 37830181629](https://github.com/gangan668/softhe.io/actions/runs/37830181629) accepted its trigger, detected one fulfillment failure and the preceding Stripe marker, and failed at the intended evaluation. Notification receipt was requested but is not yet verified.
- Vercel custom-domain automatic assignment was turned off to allow an authorized source merge without automatically serving an unqualified deployment. Public health still identified `77aead61515245e553efdda15fdaf4973b7e462a` afterward. Monitoring scheduling remains false. No DNS records were changed.
