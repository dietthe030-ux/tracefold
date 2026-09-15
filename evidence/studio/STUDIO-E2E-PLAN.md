# Tracefold Studio E2E plan

Historical plan for the invalidated `df837d5` source/address only. E01 passed, E02 failed, and no dependent case ran. This plan and its former fee authorization cannot be used for the corrected source; see `E02-REPLACEMENT-E2E-PLAN.md`.

Exact target: contract `0xD99Bf40623A7554256F18168C64B482777f10237`, source SHA-256 `DE542180BA58FE382F9E55CBD8C7776C989B80766FC87F4882F3CB27FF71552D`, Git revision `df837d56c3cbb0db76d0e08ad57d582659dbe51b`, actor `actor19` / `0x9ec6a971ff91c7540cce6432e7abf7ece005d5a5`, Studio Dev chain 61997.

Cases are sequential. Every write gets a fresh read-only fee estimate, one stable operation ID, one broadcast, bounded receipt observation, semantic execution inspection, consensus/finality proof and authoritative pre/post readback. A transport timeout keeps the same hash and operation ID. All attempts, including expected failures, enter the evidence ledger.

| ID | Criterion / risk | Method and exact non-secret arguments | Expected consequence and readback |
|---|---|---|---|
| E00 | Deployment identity and empty state | `get_counts`, `get_upgrader`, `gen_getContractCode` | FINALIZED accepted deploy; exact byte parity; actor is upgrader; all counters zero. Already recorded in `deployment.json`. |
| E01 | Proposal creation and nonce binding | `propose_alias_set("tf-e2e-log4shell","CVE-2021-44228","GHSA-jfh8-c2jp-5v3q","")` | New proposal 1, `PROPOSED`, exact canonical IDs, nonce lookup 1, proposal count +1. |
| E02 | Conclusive SAME creates first cluster | `assess_proposal(1)` | Semantic success; proposal 1 `MERGED`; assessment `SAME_VULNERABILITY`; cluster 1 contains both identifiers; cluster count +1. |
| E03 | Independent second proposal | `propose_alias_set("tf-e2e-log4j-fix","CVE-2021-45046","GHSA-7rjr-3q55-vv33","")` | New proposal 2 in `PROPOSED`; exact nonce/readback. |
| E04 | Second SAME creates independent cluster | `assess_proposal(2)` | Proposal 2 `MERGED`; cluster 2 contains the exact pair; no mutation to cluster 1. |
| E05 | Cross-cluster invariant | `propose_alias_set("tf-e2e-cross-cluster","CVE-2021-44228","GHSA-7rjr-3q55-vv33","")` | Proposal 3 created directly as `CONFLICT`, conflicting clusters `[1,2]`; both clusters unchanged. |
| E06 | Objection persistence | `propose_alias_set("tf-e2e-objection","CVE-2022-22965","GHSA-36p3-wjmg-h94x","")` then `record_objection(4,"DIFFERENT_ROOT_CAUSE","Live E2E objection guard")` | Proposal 4 remains open with one immutable objection; paged objection readback matches actor/code/note. |
| E07 | Objection blocks a consequential SAME merge | `assess_proposal(4)` | If sources classify the exact published alias pair as SAME, final status is `UNRESOLVED` and cluster count stays 2. Any source-driven non-SAME outcome remains non-conclusive and is recorded, but does not by itself prove the SAME objection branch. |
| E08 | Unavailable-source fail-closed path | `propose_alias_set("tf-e2e-unavailable","CVE-2099-99999999","","")`, then `assess_proposal(5)` | Proposal 5 becomes `UNRESOLVED`; evidence/source status explains unavailable data; clusters unchanged. |
| E09 | Retry cooldown rejection | `retry_unresolved(5)` immediately after E08 | Expected semantic rejection `Retry cooldown active`; proposal/assessment/counters unchanged. |
| E10 | Distinct pair causes no merge | `propose_alias_set("tf-e2e-distinct","CVE-2021-45046","GHSA-36p3-wjmg-h94x","")`, then `assess_proposal(6)` | `RELATED_NOT_SAME` or `DISTINCT`, proposal `KEPT_SEPARATE`; clusters unchanged. If live evidence becomes ambiguous, fail closed as `UNRESOLVED` and record that the distinct live criterion remains unresolved. |
| E11 | Incident consumption exact-once | `consume_incident("tf-e2e-incident-001","1")` | Returns true; consumption count +1; paged receipt binds actor/context/cluster 1. |
| E12 | Duplicate consumption rollback | repeat `consume_incident("tf-e2e-incident-001","1")` | Expected semantic rejection `Incident already consumed`; count and original receipt unchanged. |

The exact-source local suite already proves all five objection codes, caps, invalid callers, unauthorized upgrade, upgrade storage preservation, malformed/oversized/injected source data, deterministic boundary cases and validator disagreement. A live disposable upgrade rehearsal is excluded because Tracefold does not advertise live upgrade execution as a user feature, has no linked-contract migration, and the exact current runtime lifecycle passed locally. Repeating deterministic cap permutations on-chain would spend fees without adding a distinct live-risk proof.

E07 and E10 have explicit evidence-dependent acceptance rules because external authorities can change. They are never coerced into a claimed outcome. If their intended branch is not observed, the ledger records the actual result and the primary AI selects a new public, preverified identifier pair only through a documented matrix correction before any new transaction.
