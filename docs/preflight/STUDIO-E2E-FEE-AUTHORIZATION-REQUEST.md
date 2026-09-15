# Studio E2E fee authorization request

Historical target-scoped request for the invalidated `df837d5` source/address. It is exhausted for release purposes by the E02 product failure and does not authorize corrected-source replacement deployment or E2E. See `E02-REPLACEMENT-FEE-REQUEST.md`.

Status: awaiting explicit user response.

- Contract: `0xD99Bf40623A7554256F18168C64B482777f10237`
- Network: `studio-dev`, chain 61997
- Actor: `actor19` / `0x9ec6a971ff91c7540cce6432e7abf7ece005d5a5`
- Matrix: `evidence/studio/STUDIO-E2E-PLAN.md`
- Maximum number of fee-bearing operations: 13
- Per-operation fee-deposit ceiling: 0.25 GEN
- Cumulative fee-deposit ceiling: 3.25 GEN
- First measured estimate: 613844400010352 wei (0.000613844400010352 GEN) for E01 `propose_alias_set`

For every operation, the exact current estimate must be submitted unchanged. Stop before broadcast if either ceiling would be exceeded. Finalized refunds and consumed fees must be recorded separately. No transaction is authorized by this request until the user explicitly confirms it.
