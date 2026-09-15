# Tracefold R12 Studio E2E matrix

Status: PRE_DEPLOY draft. Artifact revision is `8b1beb58033ff173ea37259ca4bf74ad308aa894`. Candidate contract source is 50,573 bytes with SHA-256 `E20CB3BE22885CF92BFA91376EB615B6ACEB8DF024421EB19F29108D33315D2C`. Target: `studio-dev`, chain 61997, RPC `https://studio-dev.genlayer.com/api`. Deployer, upgrader and test actor: `actor19`, public address `0x9ec6a971ff91c7540cce6432e7abf7ece005d5a5`.

Addresses `0xD99Bf40623A7554256F18168C64B482777f10237`, `0x5E2899A296378a42d2F5542507cac3094bD8b84E`, `0x4939F578D1d49F6fD01aFfEC997e11E8d256C61c` and `0x769f408F69fc2ef93f5D59853aba14FF4ef1226e` are retired. No further writes are authorized against them. Every `tf3-*` operation is retired. R12 uses only the fresh `tf4-*` IDs below.

The exact GenLayerJS 2.0.0-rc.1 route is used where an empty positional string is required because the PowerShell CLI wrapper rejects an empty token. It uses the same external actor19 keystore without copying or printing secret material. Other calls use the verified CLI wrapper. Each write receives an official fee estimate, one operation ID and one broadcast. Its hash is persisted immediately and reconciled without resubmission. PASS requires `FINALIZED`, `FINISHED_WITH_RETURN`, `MAJORITY_AGREE`, matching sender/origin and authoritative readback. Expected negative cases are fee simulations only and require the exact error plus unchanged state.

| Case | Operation and exact call | Required proof |
|---|---|---|
| T00 | `tf4-deploy-e20cb3b`; deploy exact source with constructor `0x9ec6a971ff91c7540cce6432e7abf7ece005d5a5` | Fresh address; exact source parity; upgrader actor19; counts 0/0/0. |
| T01 | `tf4-t01-propose-alias`; `propose_alias_set("tf4-alias","CVE-2024-26130","","PYSEC-2024-225")` | Proposal 1 PROPOSED; exact IDs/nonce; `created_at` equals the transaction timestamp. |
| T02 | `tf4-t02-assess-alias`; `assess_proposal(1)` | NVD/OSV 200; SAME_VULNERABILITY; MERGED into cluster 1; authoritative timestamps and reproducible fingerprint. |
| T03P | `tf4-t03p-propose-cluster2`; `propose_alias_set("tf4-cluster2","CVE-2023-41335","","PYSEC-2023-185")` | Proposal 2 PROPOSED with exact IDs. |
| T03A | `tf4-t03a-assess-cluster2`; `assess_proposal(2)` | SAME/MERGED; cluster 2 exact aliases; cluster 1 unchanged. |
| T04 | `tf4-t04-cross-conflict`; `propose_alias_set("tf4-cross","CVE-2024-26130","","PYSEC-2023-185")` | Proposal 3 CONFLICT with `[1,2]`; both clusters unchanged. |
| T05 | `tf4-t05-objection-proposal`; `propose_alias_set("tf4-objection","CVE-2022-40897","","PYSEC-2022-43012")` | Proposal 4 PROPOSED, zero objections. |
| T06 | `tf4-t06-objection`; `record_objection(4,"DIFFERENT_ROOT_CAUSE","Live authoritative-time objection guard")` | Objection 1 with exact actor/reason/note and receipt-bound `created_at`; counts 4/2/0. |
| T07 | `tf4-t07-objection-assess`; `assess_proposal(4)` | Underlying SAME evidence; objection guard produces UNRESOLVED, one history row, attempts 1; clusters unchanged. |
| T08 | `tf4-t08-unavailable-proposal`; `propose_alias_set("tf4-unavailable","CVE-2099-99999999")` | Proposal 5 PROPOSED with no cluster. |
| T09 | `tf4-t09-unavailable-assess`; `assess_proposal(5)` | UNRESOLVED, one history row, attempts 1, no cluster; receipt-bound `last_assessed_at`. |
| T10 | `tf4-t10-cooldown-negative`; immediate fee simulation of `retry_unresolved(5)` | Exact cooldown error with remaining seconds in 1..600; no broadcast; proposal/history/counts unchanged. |
| T11 | `tf4-t11-cooldown-expiry`; after T09 transaction timestamp +600 seconds, `retry_unresolved(5)` | One finalized write; attempts/history become 2; last timestamp equals receipt; counts remain 5/2/0. |
| T12 | `tf4-t12-distinct-proposal`; `propose_alias_set("tf4-distinct","CVE-2021-45046","","PYSEC-2022-43012")` | Proposal 6 PROPOSED; clusters unchanged. |
| T13 | `tf4-t13-distinct-assess`; `assess_proposal(6)` | DISTINCT or RELATED_NOT_SAME and KEPT_SEPARATE; one history row; clusters remain 2. UNRESOLVED keeps the case open. |
| T14 | `tf4-t14-consume`; `consume_incident("tf4-incident-001","1")` | True; consumption 1 has exact caller/context/cluster and receipt-bound time. |
| T15 | `tf4-t15-duplicate-consume`; fee simulation of the same consume call | Exact duplicate error; no broadcast; receipt and counts unchanged. |

Dependent cases execute sequentially. T12-T15 may run while waiting for T11 cooldown. Exact local GHSA multi-package coverage and historical R02 remain scoped corroboration only. Any source, constructor, actor or network change invalidates this matrix.
