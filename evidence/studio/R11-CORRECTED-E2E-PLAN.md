# Tracefold authoritative-time replacement Studio matrix

Status: PRE_DEPLOY draft. Release address is pending. Candidate source SHA-256 is `EE025A5DB319310F9E0EF0577A22CACD9D07DCEFA39FE60C813D7D704EF18EC0` (50,449 bytes). Target is `studio-dev`, chain 61997, RPC `https://studio-dev.genlayer.com/api`; deployer/upgrader/test actor is `actor19`, address `0x9ec6a971ff91c7540cce6432e7abf7ece005d5a5`. Addresses `0xD99Bf40623A7554256F18168C64B482777f10237` and `0x5E2899A296378a42d2F5542507cac3094bD8b84E` are historical and will receive no further writes.

Every write uses an exact tool fee estimate, one new stable `tf3-*` operation ID and one broadcast. The same hash is observed with bounded polling. PASS requires `FINALIZED`, semantic `FINISHED_WITH_RETURN`, successful consensus, matching sender/origin and authoritative readback. Expected rejection requires the exact error and unchanged state. No failed operation ID is replayed.

| Case | Purpose and exact call | Required proof |
|---|---|---|
| T00 | `tf3-deploy-ee025a5`; deploy exact source with constructor actor19 | Fresh address; exact 50,449-byte source/hash parity; upgrader actor19; all counts zero. |
| T01 | `tf3-t01-propose-alias`; `propose_alias_set("tf3-alias","CVE-2024-26130","","PYSEC-2024-225")` | Proposal 1 PROPOSED, exact IDs/nonce, transaction `created_at` equals the authoritative transaction timestamp. |
| T02 | `tf3-t02-assess-alias`; `assess_proposal(1)` | NVD/OSV 200; SAME_VULNERABILITY; proposal MERGED; cluster 1 exact aliases; assessment `assessed_at` and proposal `last_assessed_at` equal the authoritative transaction timestamp; fingerprint reproduced. |
| T03 | `tf3-t03-conflict-base`; propose and assess one separately preverified NVD/OSV alias pair | Second cluster is created without changing cluster 1. The exact pair is locked in evidence before the write. |
| T04 | `tf3-t04-cross-conflict`; propose one ID from each cluster | CONFLICT lists `[1,2]`; both clusters remain byte-equivalent. |
| T05 | `tf3-t05-objection-proposal`; propose a fresh preverified alias pair | Open PROPOSED record with zero objections. |
| T06 | `tf3-t06-objection`; `record_objection(...,"DIFFERENT_ROOT_CAUSE","Live authoritative-time objection guard")` | Immutable row contains actor/reason/note and `objected_at` equals receipt transaction timestamp. |
| T07 | `tf3-t07-objection-assess`; assess the objected proposal | Guard yields UNRESOLVED with no cluster mutation and reproducible fingerprint/history. |
| T08 | `tf3-t08-unavailable-proposal`; `propose_alias_set("tf3-unavailable","CVE-2099-99999999")` | Proposal is PROPOSED with no cluster. |
| T09 | `tf3-t09-unavailable-assess`; `assess_proposal(...)` | UNRESOLVED, exact record absent, one history row, no cluster; `last_assessed_at` equals receipt timestamp. |
| T10 | `tf3-t10-cooldown-negative`; immediate fee simulation of `retry_unresolved(...)` | Unsent cooldown rejection reports a value within 1–600 seconds; proposal/history/counts unchanged and no operation journal/hash. |
| T11 | `tf3-t11-cooldown-expiry`; after the authoritative 600-second boundary, retry the same unresolved proposal once | Fee estimate succeeds; single broadcast finalizes; attempts/history increase exactly once; the prior 56,895,061-second anomaly is absent. Useful independent cases run during the interval; no polling loop or blind retry is used. |
| T12 | `tf3-t12-distinct-proposal`; propose a preverified unrelated NVD/OSV pair | Proposal is PROPOSED with exact IDs/nonce. |
| T13 | `tf3-t13-distinct-assess`; assess it | DISTINCT or RELATED_NOT_SAME and KEPT_SEPARATE, or honestly UNRESOLVED; no false merge. A non-conclusive result keeps this criterion open. |
| T14 | `tf3-t14-consume`; `consume_incident("tf3-incident-001","1")` | True; one caller/context/cluster receipt with `consumed_at` equal receipt timestamp. |
| T15 | `tf3-t15-duplicate-consume`; exact duplicate fee simulation | Expected unsent duplicate rejection and unchanged original receipt/count. |

The fixed-source live matrix uses preverified NVD/OSV pairs for deterministic availability. The earlier R02 transaction remains historical corroboration that the unchanged GHSA multi-package mapping reached SAME on Studio; the exact local multi-package regression is rerun on this candidate. Neither substitutes for corrected-source time cases T01/T02/T06/T09/T10/T11/T14. Any source/configuration change invalidates this plan and requires another exact-source review.
