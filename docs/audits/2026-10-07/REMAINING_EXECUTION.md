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
