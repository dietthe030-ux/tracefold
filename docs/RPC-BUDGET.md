# Frontend RPC Budget

Required only for a GenLayer-connected frontend. Studio deployment/testing does not use this artifact.

## Applicability

RPC_BUDGET_REVISION: TRACEFOLD-PLAN-2
OFFICIAL_DOCS_CHECKED: 2026-09-15 — GenLayerJS contracts, writing data, finality, Studio Dev network
FRONTEND_SCOPE: APPLICABLE — Layer 1 public Docs plus Layer 2 wallet-connected operations on studio-dev/61997

APPLICABLE: Layer 2 reads and writes a Tracefold Intelligent Contract. Layer 1 uses no RPC until its explicit live-summary widget is visible; that widget shares the same client/cache.

## FRONTEND RPC BUDGET MATRIX

FRONTEND_MATRIX_STATUS: COMPLETE
MULTI_CLIENT_JUSTIFICATION: NOT_REQUIRED

Required before implementing or repairing any GenLayer-connected frontend, including read-only frontends.

| Screen/workflow | Request source | RPC method | Trigger | Cache key / TTL | In-flight dedupe | Invalidation | Poll interval / attempts | Retry/backoff/cancel | Planned maximum | Transaction count | Terminal/readback condition |
|---|---|---|---|---|---|---|---|---|---:|---:|---|
| Layer 1 Docs/static content | local bundle | none | navigation/render | immutable build asset | browser native | release only | none | none | 0 | 0 | rendered content |
| Layer 1 live summary | shared read client | `readContract:get_counts` | widget enters viewport or manual refresh | chain+contract+get_counts / 10s | identical promise | successful write, contract/network change | none | no automatic retry; hidden tabs pause queued work | 1 | 0 | parsed counts or explicit unavailable state |
| Workspace initial lists | shared read client | `get_counts`, `get_paged_proposals(0,20)`, `get_paged_clusters(0,20)`, `get_paged_consumptions(offset,20)`, `get_upgrader` | route entry | chain+contract+method+args / 10s | per normalized key | affected write, network/contract change | none | no automatic retry; hidden tabs pause queued work | 5 | 0 | bounded lists rendered/error |
| Proposal lookup | shared read client | `get_proposal`, `get_assessment_history`, `get_paged_objections` | explicit ID submit | chain+contract+method+ID / 10s | per normalized key | write touching proposal; chain/contract change | none | no automatic retry; newer lookup may supersede rendered result | 3 | 0 | all requested panels resolve/error |
| Cluster/alias lookup | shared read client | `get_cluster` or `resolve_alias` | explicit lookup | chain+contract+method+normalized arg / 10s | per normalized key | merge write; chain/contract change | none | no automatic retry | 1 | 0 | parsed cluster/not-found |
| Wallet connect/sync | selected EIP-6963 provider | `eth_requestAccounts`, `eth_chainId`; switch/add only when needed | explicit wallet choice, provider event | never cached | single connect lock | account/chain/disconnect | none | no automatic retry | 3 (+2 only for add-chain fallback) | 0 | one selected provider/account and chain 61997 |
| Proposal write | selected provider + GenLayer client | fee estimate, `writeContract:propose_alias_set`, finality, proposal/nonce readback, state refresh | explicit confirmed submit | no consequential cache | one operation lock | all read keys after finality | 5s / 24 attempts | SDK observation is bounded; never resubmit hash | 34 | 1 | same hash; FINALIZED; semantic success; consensus; proposal/nonce readback |
| Assess or retry | selected provider + GenLayer client | proposal/history pre-state, fee estimate, write, finality, proposal/history readback, state refresh | explicit confirmed submit | no consequential cache | one operation lock | all read keys after finality | 5s / 24 attempts | retained-hash reconciliation; no write retry | 36 | 1 | attempts and history advance exactly once; latest record matches history and expected consequence |
| Objection/conflict | selected provider + GenLayer client | proposal pre-state, fee estimate, write, finality, exact objection readback, state refresh | explicit confirmed submit | no consequential cache | one operation lock | all read keys after finality | 5s / 24 attempts | retained-hash reconciliation; no write retry | 34 | 1 | objection count advances exactly once and exact new record matches caller/code/note |
| Incident consumption | selected provider + GenLayer client | count pre-state, fee estimate, write, finality, `is_consumed`, ledger readback, state refresh | explicit confirmed submit | no consequential cache | one operation lock | all read keys after finality | 5s / 24 attempts | retained-hash reconciliation; no write retry | 35 | 1 | boolean true and exactly one matching new consumption ledger record |
| Pending operation recovery | shared client | finality, terminal receipt, method-specific readback, state refresh | reload with persisted hash or manual recheck | hash-bound only | one hash observer | terminal reconciliation | 5s / 24 attempts | no transaction retry; same hash retained | 32 | 0 | terminal verified state or RECONCILIATION_REQUIRED |

For a read-only frontend, record transaction count `0`; do not invent write requirements. If no GenLayer frontend exists, record `NOT APPLICABLE` and the checked dependency boundary.

## FRONTEND RPC BUDGET EVIDENCE

FRONTEND_EVIDENCE_STATUS: INCOMPLETE

Measure the exact deployed critical journeys before the applicable checkpoint and release.

| Screen/workflow | Request source/method | Actual requests | Cache hit/miss | In-flight dedupe | Poll attempts | Retry/delay | Invalidations | Readback calls | Actual transactions | Variance/result |
|---|---|---:|---|---|---:|---|---|---:|---:|---|

## Closure

- No unexplained multiple read clients.
- No render/Strict-Mode request amplification.
- Polling is bounded to 24 observations at five-second intervals and tears down at a terminal result; queued reads pause while the tab is hidden.
- A 429 opens one jittered 3–5 second cooldown for later requests; the failed read is surfaced and is not retried automatically.
- A returned transaction hash is reconciled; no automatic or duplicate resubmission occurs.
- Mandatory finality, semantic execution and authoritative readback remain intact.
- Anonymous reviewer checked every applicable matrix/evidence section for the exact package.
