ANONYMOUS REVIEW CHANGES REQUIRED - PRE_DEPLOY

REVIEWER: anonymous co-review AI
CHECKPOINT: PRE_DEPLOY
Package ID: TRACEFOLD-PREDEPLOY-424CA2A
Revision: 424ca2a69038a8e6215dd4d6744cf0b129a9d8bf
Reviewer Task ID: 01a0a536-2f73-7ed1-b962-9f40520d4e77
openBlockingFindings: 5

The reviewer recomputed the supplied package, readiness, source, test, schema, documentation and lockfile hashes. It independently confirmed exact HEAD and a clean tree; live schema parity with 19 methods; chain 61997; actor19 balance of 110000000000000000000 wei; zero submitted transactions; and the supplied lint, 21/21 contract, 71/71 frontend, typecheck and build results.

Required corrections:

1. `F-01 [P1]`: objection reason choices/default did not match the contract ABI. Align every rendered code and add coverage.
2. `F-02 [P1]`: objection and assess/retry readbacks could attribute old or unchanged state to the new hash. Bind success to the operation's pre/post delta and cover stale states.
3. `F-03 [P1]`: the objection guard changed the outcome after fingerprinting. Fingerprint the final guarded assessment and prove reproduction.
4. `F-04 [P1]`: LLM fields could strengthen deterministic package/cross-reference evidence, and package names ignored ecosystem. Derive merge authorization from raw ecosystem/name coordinates and exact links; cover a forged `SAME` response.
5. `F-05 [P1]`: the visible consumption ledger was never populated. Add a bounded authoritative view and frontend fetch/readback, or remove the claim.

Residual corrections:

- `F-06 [P2]`: the primary proposal field accepted GHSA/OSV although the contract requires a CVE. Align the UI or ABI.
- `F-07 [P2]`: the RPC matrix claimed retry/cancellation and 3-second polling that the implementation did not provide. Make the matrix exact and measure only during deployed journeys.

Scope boundary: PRE_DEPLOY only; no deploy/live-E2E/release approval.
