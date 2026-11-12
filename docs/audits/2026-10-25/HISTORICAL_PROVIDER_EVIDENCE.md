# Recovered historical provider evidence

Reviewed on 2026-10-25. These observations retain their original October 8 and 9 dates. No new payment, webhook replay, email, account, provider setting, or production change was initiated to collect this evidence.

## Monitoring detection and actual receipt

The connected GitHub API and Gmail mailbox independently corroborate both historical controlled tests.

| Test | Workflow run | Accepted event | Alert evaluation | Actual mailbox receipt |
| --- | --- | --- | --- | --- |
| Stripe webhook | [37830176614](https://github.com/gangan668/softhe.io/actions/runs/37830176614) | `kind=stripe`, 2026-10-08T19:12:47Z | One Stripe webhook failure detected at 19:13:17Z; expected evaluation failure | Gmail message `1a11cef89bba816b`, delivered to the intended operator mailbox at 19:13:40Z; body links to this exact run |
| Fulfillment | [37830181629](https://github.com/gangan668/softhe.io/actions/runs/37830181629) | `kind=fulfillment`, 2026-10-08T19:13:58Z | One fulfillment failure and the preceding Stripe marker detected at 19:14:36Z; expected evaluation failure | Gmail message `1a11cf0b9d1068c6`, delivered to the intended operator mailbox at 19:14:59Z; body links to this exact run |

Fresh GitHub job inspection confirmed that health verification, controlled event emission, and log queries succeeded before alert evaluation failed. The relevant job IDs are `113493184944` and `113493623318`. Their decoded logs explicitly contain the matching accepted event and failure counts. Gmail full MIME inspection confirmed the actual received messages and exact workflow links. Raw MIME, notification-management tokens, headers unrelated to receipt verification, and authentication material are not included here.

This closes the missing receipt evidence for those historical synthetic alert tests. It does not prove a fresh production outage, a new provider failure, or alert configuration on every later deployment.

## Asynchronous test settlement and idempotency

Recovered the original sanitized browser snapshots and execution record from the earlier `codex/website-audit-remediation` worktree. These are saved observations from an isolated Stripe Sandbox test, not fresh Stripe or Redis reads.

- Session: `cs_test_a1UVowG7YMRIxiJcWKDEaQlcCWloTf1Cam6QRA8MBPBYdPcKGfVpurgZU6`.
- Product and amount: Custom Windows 11 ISO, EUR75, test mode.
- Unpaid completed event: `evt_1UOh3q2EodKilmfKv7cQpoJX`, 2026-10-09T16:54:22Z. The archived response is HTTP 200 with `status: payment-pending`. The execution record reports no durable order/completed marker at this phase.
- Async success event: `evt_1UOh4Q2EodKilmfKrAHPv7Gl`, created at 16:54:58Z and delivered at 16:55:02Z. The recorded isolated Redis observation reports the exact order, amount 7500, one fulfillment attempt, and completed marker.
- Manual replay at 16:58:56Z returned HTTP 200 with `status: duplicate`. The recorded follow-up retains one attempt, the same completed marker, no pending-processing entry, and one receipt.
- On 2026-10-25, a fresh exact-session Gmail search returned only the original receipt, message `1a12196ef6bd8027`. Its body independently confirms payment, the session reference, Windows 11 product, and EUR75 total. Original receipt time is 2026-10-09T16:55:02Z.

The session was created directly through the provider in the isolated environment. It was not a public website SEPA purchase. This evidence does not enable SEPA, establish real bank settlement, or qualify the current main deployment's commerce behavior. A new candidate-specific provider pass remains separate.

## Archive provenance

The source files were read from `docs/audits/2026-10-07/` in the existing earlier worktree. Their SHA-256 hashes were recomputed during this review:

| Archived source | SHA-256 |
| --- | --- |
| `2026-10-09-stripe-async-unpaid.txt` | `23c6e04fd305258f9603015df28237076273c1721020b9d7d72afec7807b95e6` |
| `2026-10-09-stripe-async-success-replay.txt` | `f7c0a0b58a79dfc02af36931769fd9040c716b59badc2def502ae50ad6958068` |
| `2026-10-09-six-item-execution.md` | `47ecb4052dbed2ae1c50098ff69d3100910eea992886ea13e7d7bacfd30e6887` |

Only the relevant sanitized observations are carried into this repository. The original archive was not edited. The current `launch-evidence.json` candidate record and all unrelated evidence dates remain unchanged. Legal and accounting approvals remain pending.
