# Tracefold frontend RPC budget preflight

This machine-checked projection preserves the reviewed limits in `docs/RPC-BUDGET.md`; compound formulas are resolved to numeric maxima required by the action preflight.

## FRONTEND RPC BUDGET MATRIX

FRONTEND_MATRIX_STATUS: COMPLETE

| Screen/workflow | Request source | RPC method | Trigger | Cache key / TTL | In-flight dedupe | Invalidation | Poll interval / attempts | Retry/backoff/cancel | Planned maximum | Transaction count | Terminal/readback condition |
|---|---|---|---|---|---|---|---|---|---:|---:|---|
| Layer 1 Docs/static content | local bundle | none | navigation/render | immutable build asset | browser native | release only | none | none | 0 | 0 | rendered content |
| Layer 1 live summary | shared read client | read counts | widget enters viewport or manual refresh | chain+contract+counts / 30s | identical promise | successful write, contract/network change | none | one retry after 1s; abort hidden/unmount | 2 | 0 | parsed counts or explicit unavailable state |
| Workspace initial lists | shared read client | counts and two bounded lists | route entry | chain+contract+method+args / 10s | per normalized key | affected write, network/contract change | none | one retry after 1s; abort hidden/unmount | 6 | 0 | bounded lists rendered/error |
| Proposal lookup | shared read client | proposal, history and objections | explicit ID submit | chain+contract+method+ID / 10s | per normalized key | write touching proposal; chain/contract change | none | one retry after 1s; cancel new ID/unmount | 6 | 0 | all requested panels resolve/error |
| Cluster/alias lookup | shared read client | cluster or alias resolution | explicit lookup | chain+contract+method+normalized arg / 30s | per normalized key | merge write; chain/contract change | none | one retry after 1s; cancel new lookup | 2 | 0 | parsed cluster/not-found |
| Wallet connect/sync | selected wallet provider | account, chain and bounded switch/add | explicit wallet choice, provider event | never cached | single connect lock | account/chain/disconnect | none | no automatic retry | 5 | 0 | one selected provider/account and correct network |
| Proposal write | selected provider and GenLayer client | estimate, write, lifecycle, receipt and readback | explicit confirmed submit | no consequential cache | one operation lock | proposal/count/list keys after verified result | 3s / 40 attempts | bounded transport retry; never resubmit hash | 45 | 1 | same hash, finality, semantic success, consensus and readback |
| Assess or retry | selected provider and GenLayer client | estimate, write, lifecycle, receipt and readback | explicit confirmed submit | no consequential cache | one operation lock | proposal/history/cluster/count keys | 3s / 60 attempts | bounded transport retry and retained-hash reconciliation | 66 | 1 | same hash and verified state/history/cluster consequence |
| Objection/conflict | selected provider and GenLayer client | estimate, write, lifecycle, receipt and readback | explicit confirmed submit | no consequential cache | one operation lock | proposal/objection keys | 3s / 40 attempts | bounded transport retry; no resubmit | 45 | 1 | semantic success or expected rollback plus readback |
| Incident consumption | selected provider and GenLayer client | estimate, write, lifecycle, receipt and readback | explicit confirmed submit | no consequential cache | one operation lock | consumption key | 3s / 40 attempts | bounded transport retry; no resubmit | 44 | 1 | semantic success or expected duplicate rollback and boolean readback |
| Pending operation recovery | shared client | lifecycle, receipt and method-specific readback | reload with persisted hash or manual recheck | hash-bound only | one hash observer | terminal reconciliation | 3s / remaining original cap | observe retained hash only | 64 | 0 | terminal verified state or reconciliation required |
