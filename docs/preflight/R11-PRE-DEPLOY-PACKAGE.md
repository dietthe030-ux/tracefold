# Tracefold R11 PRE_DEPLOY package

Checkpoint: `PRE_DEPLOY`. Package: `TRACEFOLD-R11-AUTHORITATIVE-TIME`. Candidate release address: pending fresh deployment. Workflow: Milestones using Build gates for the independent artifact.

The Studio R11 negative probe exposed a deterministic 56,895,061-second cooldown caused by mixing the Python runner clock with GenLayer transaction time. No R11 transaction was broadcast. The deployment at `0x5E2899A296378a42d2F5542507cac3094bD8b84E` is retained as historical and invalidated for release acceptance.

Candidate source `contracts/tracefold.py` is 50,674 bytes, SHA-256 `2ED3F93EF341BB98CDD288522D1868AE5DC27EFAB633639552E3D1DA7395377F`. `_get_current_datetime()` now accepts only a non-empty string from `gl.message_raw["datetime"]` and otherwise raises `UserError`. ABI, storage layout/order, constructor, upgrader, trust boundary, retry duration and product state machine are unchanged.

Evidence:

- `evidence/studio/R11-cooldown-anomaly.json`: unsent live defect reproduction.
- `docs/preflight/R11-CORRECTION-PLAN.md`: root cause, blast radius and recovery choice.
- `evidence/studio/R11-DEPLOYMENT-INVALIDATION.md`: exact old-address invalidation.
- `evidence/pre-deploy/r11-contract-tests.txt`: 29/29 DirectVM tests PASS, including authoritative fixed-time and missing-time fail-closed regressions plus the multi-package alias regression.
- `evidence/pre-deploy/r11-contract-lint.txt`: linter 0.11.1rc2 PASS, three checks; 20 methods (14 view, 6 write).
- `evidence/pre-deploy/r11-live-schema.json`: current Studio Dev read-only schema PASS on chain 61997 with the same constructor and 20 methods.
- `.gitattributes`: `contracts/*.py -text`, preventing checkout line-ending conversion from changing reviewed/deployed bytes.
- `evidence/studio/R11-CORRECTED-E2E-PLAN.md`: fresh deployment and T00-T15 live matrix with new `tf3-*` operation IDs.

Experience lookup searched the current build ledger for datetime, message_raw, clock, timestamp, cooldown and retry. No entry described this exact mixed-clock defect. Applied the matching controls for time-gated actions and smart repair: one authoritative predicate, boundary regression, preserved failed evidence, root-cause correction before rerun, stable operation identity and no blind retry.

Requested reviewer result: independently recompute candidate/package/evidence hashes; inspect the source and tests; verify current schema/tool/network identity; assess source/storage/API parity and the fresh-deploy matrix; return literal `PRE_DEPLOY APPROVED` only with zero blocking findings. Approval is revision/package scoped and does not imply POST_DEPLOY acceptance.

Exact source/test/evidence baseline revision: `be2b0fdd50b71c67b52ee79062d8cf971f6bc122`. The final package HEAD is independently locked by the reviewer delivery and approval record; this document cannot contain its own enclosing commit hash.

- tests/conftest.py SHA-256: E6F49301143DBA0A32ACAF0736439222FB611E3AAD6259C8620F283FEF94C3FF
- tests/test_tracefold.py SHA-256: ABFE816C032F6D2994C3C9338CF63B320FE0016425025CA9384D9C0AF658D34F
- evidence/pre-deploy/r11-contract-tests.txt SHA-256: 9C3F8E4A9CA47D037C04E13479785CF44E5F02D68ED46EB932E89A77AC1CD0F6
- evidence/pre-deploy/r11-live-schema.json SHA-256: 3EE34F174EA23D3BC268DF7AFBCC203FC20DB092988176D42714439E8CB23FA2
- evidence/pre-deploy/r11-source-preverification.json SHA-256: 2D8C23E04E788B851A4208BE75A5D816DA6F0E8567E9529C99A73BDB81E85EB4
