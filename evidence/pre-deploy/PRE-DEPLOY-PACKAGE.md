# Tracefold PRE_DEPLOY candidate

Checkpoint candidate for independent `PRE_DEPLOY` review. No Studio write or deployment has occurred.

## Exact candidate

- Contract: `contracts/tracefold.py`
- SHA-256: `08A6C58844526B0796C8735883EB10269F1193286416B3972B3AD668C556FFD3`
- Header: GenVM `v0.3.0`
- Runtime selector used by lint/tests: `v0.6.0-rc5`
- Dependency: `py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng`
- GenLayerJS: `2.0.0-rc.1`
- Target: `studio-dev`, chain `61997`, `https://studio-dev.genlayer.com/api`
- Read-only Studio readiness: `studio-tool-readiness.json`; official CLI `0.40.0-rc.3`, GenLayerJS `2.0.0-rc.1`, linter `0.11.1rc2`, actor `actor19` at `0x9ec6a971ff91c7540cce6432e7abf7ece005d5a5`, actual balance `110000000000000000000` wei, zero writes submitted.

## Checks

- `genvm-lint contracts/tracefold.py`: PASS, 3 checks. Output: `contract-lint.txt`.
- Direct Mode via the isolated current toolchain: 21/21 PASS. It covers construction/bounds, grammar, replay protection, objection caps, all outcomes, cluster extension, cross-cluster conflict with no mutation, unavailable/malformed/oversized source data, prompt injection, validator disagreement, retry/cooldown, upgrade authorization, pagination, exact-once consumption, and objection mutation guard. Output: `contract-tests.txt`.
- Live read-only `getContractSchemaForCode` against the exact candidate: PASS. Constructor and all 19 intended public methods are present in `live-schema.json`.
- Frontend: 71/71 PASS, TypeScript PASS, production build PASS. Outputs: `frontend-tests.txt`, `frontend-typecheck.txt`, `frontend-build.txt`.
- Visual QA: desktop and 390×844 mobile verified for both the story layer and workspace. The hero preserves the two-hand composition, leaves the GenLayer/Tracefold consensus seal between the hands, and keeps the CTA separate at both breakpoints.
- Reference checkout recheck: old project remained clean at `690a94d9efe24f7334511b821adc0035639f8f0f`.

## Schema and storage inventory

The constructor accepts one string address and stores it as `gl.Address`. Persistent scalars use `gl.u32`; internal mappings are fully instantiated `TreeMap` values. JSON strings provide bounded public structured output. Storage covers proposal and cluster counters/records, nonce and identifier-set replay keys, alias resolution, objection counts/records, assessment counts/history, consumption count/receipts, and upgrader authority. No linked contract or value transfer exists.

Frontend callers match the live ABI, including `get_assessment_history(proposal_id, offset, limit)`. Pagination is capped at 20 and assessment history at 3.

## Nondeterministic inventory

One `run_nondet_default(evaluate, validate)` boundary contains bounded `web.get` acquisition from NVD, GitHub Advisory Database, and OSV plus one bounded JSON LLM classification. The validator independently reruns acquisition/classification and compares every state-authorizing field: outcome, normalized identifiers, successful sources, statuses, revisions, package/range/cross-reference/root-cause bands, target cluster, and fingerprint. Malformed wrappers, missing fields, invalid outcomes, disagreement, unavailable evidence, and invalid reasoning fail closed before mutation.

Captured closure values are primitive in-memory data; no storage proxy crosses the boundary. Direct Mode's serialization checks and deliberate-disagreement regression pass.

## Known compatibility deviation

`genvm-lint 0.11.1rc2` does not yet recognize the current recommended `run_nondet_default` call in its reachability analysis. Removing the compatibility marker produces four false reachability findings, while the exact installed v0.3 runtime exposes and documents `run_nondet_default`, Direct Mode executes it, and live schema accepts the candidate. The source therefore contains one unreachable `run_nondet(evaluate, validate)` reference solely for this linter version, followed by the actual `run_nondet_default` execution. It cannot execute or change contract behavior. Reviewer must explicitly accept or reject this deviation; it is not concealed as a normal implementation pattern.

The production bundle keeps a 613.66 kB minified GenLayer SDK chunk (132.50 kB gzip). Application code is separately 102.66 kB (25.22 kB gzip). This is a dependency-size warning, not a functional failure; replacing or partially vendoring the current SDK would weaken exact-version integrity.

## Trust and transaction gates

Public source bodies and wallet metadata are untrusted. Contract authorization derives only from caller/address state. Browser writes bind to the selected callable provider/account, verify chain and spendable balance, estimate exact fees, persist intent before signing, retain the returned hash, require `FINALIZED` plus semantic success, then verify the method-specific contract consequence. Unknown post-hash results remain `RECONCILIATION_REQUIRED`; no automatic resubmission exists.

Approval requested only for this exact revision/package and these artifacts. Deployment, live write/E2E, GitHub, Vercel, and submission remain separate future gates.
