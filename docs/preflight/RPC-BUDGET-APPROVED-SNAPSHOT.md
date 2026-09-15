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
| Layer 1 live summary | shared read client | `readContract:get_counts` | widget enters viewport or manual refresh | chain+contract+get_counts / 30s | identical promise | successful write, contract/network change | none | 1 retry after 1s; abort hidden/unmount | 2 | 0 | parsed counts or explicit unavailable state |
| Workspace initial lists | shared read client | `get_counts`, `get_paged_proposals(0,20)`, `get_paged_clusters(0,20)` | route entry | chain+contract+method+args / 10s | per normalized key | affected write, network/contract change | none | 1 retry after 1s; abort hidden/unmount | 6 | 0 | bounded lists rendered/error |
| Proposal lookup | shared read client | `get_proposal`, `get_assessment_history`, `get_paged_objections` | explicit ID submit | chain+contract+method+ID / 10s | per normalized key | write touching proposal; chain/contract change | none | 1 retry after 1s; cancel new ID/unmount | 6 | 0 | all requested panels resolve/error |
| Cluster/alias lookup | shared read client | `get_cluster` or `resolve_alias` | explicit lookup | chain+contract+method+normalized arg / 30s | per normalized key | merge write; chain/contract change | none | 1 retry after 1s; cancel new lookup | 2 | 0 | parsed cluster/not-found |
| Wallet connect/sync | selected EIP-6963 provider | `eth_requestAccounts`, `eth_chainId`; switch/add only when needed | explicit wallet choice, provider event | never cached | single connect lock | account/chain/disconnect | none | no automatic retry | 3 (+2 only for add-chain fallback) | 0 | one selected provider/account and chain 61997 |
| Proposal write | selected provider + GenLayer client | fee simulation/estimate, `writeContract:propose_alias_set`, lifecycle, receipt, proposal/nonce readback | explicit confirmed submit | no consequential cache | one operation lock | proposal/count/list keys after verified result | 3s / 40 attempts | Retry-After or capped 2/4/8s transport delays; pause hidden; cancel only observation; never resubmit hash | 1 estimate + 1 write + 40 status + 1 terminal receipt + 2 readback | 1 | same hash; EVM inclusion; stored FINALIZED; semantic success; consensus; proposal/nonce readback |
| Assess or retry | selected provider + GenLayer client | fee estimate, `assess_proposal`/`retry_unresolved`, lifecycle, receipt, proposal/history/cluster readback | explicit confirmed submit | no consequential cache | one operation lock | proposal/history/cluster/count keys | 3s / 60 attempts | bounded as above; retained-hash reconciliation | 1+1+60+1+3 | 1 | same hash and full lifecycle; expected state/history/cluster consequence |
| Objection/conflict | selected provider + GenLayer client | fee estimate, `record_objection`, lifecycle, receipt, proposal/objection readback | explicit confirmed submit | no consequential cache | one operation lock | proposal/objection keys | 3s / 40 attempts | bounded as above; no resubmit | 1+1+40+1+2 | 1 | finalized semantic success or expected rollback plus unchanged/updated state |
| Incident consumption | selected provider + GenLayer client | fee estimate, `consume_incident`, lifecycle, receipt, `is_consumed` readback | explicit confirmed submit | no consequential cache | one operation lock | consumption key | 3s / 40 attempts | bounded as above; no resubmit | 1+1+40+1+1 | 1 | finalized semantic success/expected duplicate rollback and authoritative boolean |
| Pending operation recovery | shared client | lifecycle/status, terminal receipt, method-specific readback | reload with persisted hash or manual recheck | hash-bound only | one hash observer | terminal reconciliation | 3s / remaining original cap | no transaction retry; abort observer safely | at most remaining planned attempts + 1 receipt + 3 reads | 0 | terminal verified state or RECONCILIATION_REQUIRED |

For a read-only frontend, record transaction count `0`; do not invent write requirements. If no GenLayer frontend exists, record `NOT APPLICABLE` and the checked dependency boundary.

## FRONTEND RPC BUDGET EVIDENCE

FRONTEND_EVIDENCE_STATUS: INCOMPLETE

Measure the exact deployed critical journeys before the applicable checkpoint and release.

| Screen/workflow | Request source/method | Actual requests | Cache hit/miss | In-flight dedupe | Poll attempts | Retry/delay | Invalidations | Readback calls | Actual transactions | Variance/result |
|---|---|---:|---|---|---:|---|---|---:|---:|---|

## Closure

- No unexplained multiple read clients.
- No render/Strict-Mode request amplification.
- Polling is bounded and tears down on hidden, unmounted, disconnected, settled and aborted states.
- `429`/transport retry is bounded, honors `Retry-After` when supplied and supports cancellation.
- A returned transaction hash is reconciled; no automatic or duplicate resubmission occurs.
- Mandatory finality, semantic execution and authoritative readback remain intact.
- Anonymous reviewer checked every applicable matrix/evidence section for the exact package.
