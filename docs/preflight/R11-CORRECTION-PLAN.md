# R11 authoritative-time correction

The live `retry_unresolved(6)` fee simulation rejected before broadcast with a reported 56,895,061-second remaining cooldown. Proposal 6 had been assessed only minutes earlier. No operation journal, transaction hash or fee was created.

Root cause: `_get_current_datetime()` returned `datetime.datetime.now()` before consulting `gl.message_raw["datetime"]`. The GenVM runner wall clock and the Studio transaction clock are different domains, so persisted assessment time and retry time were incomparable.

Correction: use the non-empty GenLayer transaction timestamp as the sole write-time authority and raise `UserError` when unavailable. This preserves the approved public ABI, storage types/order, constructor, actors, retry duration and state machine. The test harness synchronizes DirectVM `warp()` into the production-shaped raw-message field; a fixed 2024 timestamp assertion fails on the prior implementation.

Blast radius: every stored `created_at`, `objected_at`, `assessed_at`, `consumed_at` and retry cooldown comparison. Contract code and source hash change, so the deployment at `0x5E2899A296378a42d2F5542507cac3094bD8b84E` remains historical and cannot be the release address. Deploy a fresh clean instance after exact-source PRE_DEPLOY approval. Re-run source parity, authoritative time/cooldown boundaries, all material state transitions and final readbacks. Do not replay any `tf2-*` operation ID.

Verification: the current DirectVM suite includes authoritative fixed-time, missing-time and malformed current/persisted-time fail-closed regressions; `genvm-lint 0.11.1rc2` passes all three checks and exposes the unchanged 20-method schema; live `getContractSchemaForCode` passes on Studio Dev chain 61997. Exact passing count and test-source hashes are bound in the PRE_DEPLOY package after the final run.
