# Tracefold R11 PRE_DEPLOY package

Checkpoint: `PRE_DEPLOY`. Package: `TRACEFOLD-R11-AUTHORITATIVE-TIME`. Candidate release address: pending fresh deployment. Workflow: Milestones using Build gates for the independent artifact.

The Studio R11 negative probe exposed a deterministic 56,895,061-second cooldown caused by mixing the Python runner clock with GenLayer transaction time. No R11 transaction was broadcast. The deployment at `0x5E2899A296378a42d2F5542507cac3094bD8b84E` is retained as historical and invalidated for release acceptance.

Candidate source `contracts/tracefold.py` is 50,449 bytes, SHA-256 `EE025A5DB319310F9E0EF0577A22CACD9D07DCEFA39FE60C813D7D704EF18EC0`. `_get_current_datetime()` now accepts only a non-empty string from `gl.message_raw["datetime"]` and otherwise raises `UserError`. ABI, storage layout/order, constructor, upgrader, trust boundary, retry duration and product state machine are unchanged.

Evidence:

- `evidence/studio/R11-cooldown-anomaly.json`: unsent live defect reproduction.
- `docs/preflight/R11-CORRECTION-PLAN.md`: root cause, blast radius and recovery choice.
- `evidence/studio/R11-DEPLOYMENT-INVALIDATION.md`: exact old-address invalidation.
- `evidence/pre-deploy/r11-contract-tests.txt`: 28/28 DirectVM tests PASS, including authoritative fixed-time and missing-time fail-closed regressions plus the multi-package alias regression.
- `evidence/pre-deploy/r11-contract-lint.txt`: linter 0.11.1rc2 PASS, three checks; 20 methods (14 view, 6 write).
- `evidence/pre-deploy/r11-live-schema.json`: current Studio Dev read-only schema PASS on chain 61997 with the same constructor and 20 methods.
- `.gitattributes`: `contracts/*.py -text`, preventing checkout line-ending conversion from changing reviewed/deployed bytes.
- `evidence/studio/R11-CORRECTED-E2E-PLAN.md`: fresh deployment and T00-T15 live matrix with new `tf3-*` operation IDs.

Experience lookup searched the current build ledger for datetime, message_raw, clock, timestamp, cooldown and retry. No entry described this exact mixed-clock defect. Applied the matching controls for time-gated actions and smart repair: one authoritative predicate, boundary regression, preserved failed evidence, root-cause correction before rerun, stable operation identity and no blind retry.

Requested reviewer result: independently recompute candidate/package/evidence hashes; inspect the source and tests; verify current schema/tool/network identity; assess source/storage/API parity and the fresh-deploy matrix; return literal `PRE_DEPLOY APPROVED` only with zero blocking findings. Approval is revision/package scoped and does not imply POST_DEPLOY acceptance.
