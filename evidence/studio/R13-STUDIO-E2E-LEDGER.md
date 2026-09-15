# R13 Studio E2E ledger

Exact deployed source SHA-256: `85F6BDC602EBF5F8660D915233729ECE3B1CBE8E40EE4DA7BFA1BCE3325DC3B1`. Contract: `0x8A9c3Ae6521a1d452253F640a615937c6cf9d00D`. Actor: `actor19` / `0x9Ec6a971FF91c7540cCe6432E7abf7eCE005d5a5`. Network: Studio Dev, chain `61997`.

| Case | Result | Transaction / evidence | Authoritative consequence |
|---|---|---|---|
| T00 deploy | PASS | `0x30bbbef5527625cc49d0ca622328cf426c5136bbabd72c2fec076ee537cf7ec4` | FINALIZED, semantic success, majority agree, byte parity, upgrader actor19, empty state |
| T01 propose first alias set | PASS | `0xb9d40feacdc79bb086727e249ecb98511d0f5919f42de1bd3c3175ab9ceffd15` | Proposal 1 PROPOSED; receipt-bound timestamp |
| T02 assess first alias set | PASS | `0xa52524e9fffb80418d4da41042a38710b6bdc03723bc20538ffb78f426163d3b` | Proposal 1 MERGED as cluster 1 |
| T03P/T03A second cluster | PASS | `0xf8ad374ffe23f9c3f03e970bc6372291023667182cab7176f89aba1205c72900`, `0x39a74d7e572ce09aaf03c35ed7dc322d03a0d6c522bd4f304c9699a360283fed` | Proposal 2 MERGED as cluster 2 |
| T04 cross-cluster conflict | PASS | `0xc1100902b64c68cce5d0eae848983af539a3ffd0935ec34fad43e860dff8f409` | Proposal 3 CONFLICT `[1,2]`; clusters preserved |
| T05/T06/T07 objection guard | PASS | `0x1ee611ac17e450f77a2ca99194a88f7539c81cc7b3749cbb1268227ea24bdb39`, `0xbd4eda8b7effa39b2feb9c5bea254ebae6d88f8a7aedb2462a8ccab5f03cef2f`, `0x53ecba7f079a045dcb3995709aa9c0d874af2a03c32f02c7428a4d3ebe54b502` | One objection; assessment UNRESOLVED with guard applied; no cluster mutation |
| T08 operator dispatch attempt | RECORDED FAIL | `0x4141dcd5bfa95c478c4210eeff273705f683a65b15240e3ff02a3b28bf2a5a1b` | Undefined method rollback; counts unchanged at 4/2/0 |
| T08 corrected proposal | PASS | `0xb7adb074c0dc8ec79af0b60af6c1dabab2e695a9e8637dd959af211beca5c1d1` | Proposal 5 PROPOSED |
| T09 unavailable evidence | PASS | `0xd74c93dad557b27f69d3c4effb2a59fc5f34f46cb057eecb6d1ad4d079893841` | Proposal 5 UNRESOLVED; no cluster |
| T10 cooldown negative | PASS | `0xea1fa6e367ecb0c536cd1dbea2bd78a3eb535defc1d19122f3750f470ac40416` | Exact rollback: 543 seconds remaining; state unchanged |
| T11 cooldown expiry | PASS | `0x6718149731b518347850487dac24110db2028e61b8aeb2d58512813bc07fb3ba` | After +600 seconds, attempts/history become 2; still safely UNRESOLVED |
| T12/T13 distinct pair | PASS | `0x9716de521370e1883f5fcbf611357f5d636d6ac0df5b8c8407aca1c7c5f9528a`, `0xf6d473c7dfdb86681aaf4ed55b5b7d90aa6c5a615ab27bd74736b0024fe90698` | DISTINCT and KEPT_SEPARATE; clusters remain 2 |
| T14 CLI coercion attempt | RECORDED FAIL | `0x25c5d80615b01a34f139e6f1dbd5e7bd69b1bbafc9c2e4feb529d939ca2dc10e` | CLI coerced numeric-looking string to integer; dispatch rollback; consumption count 0 |
| T14A consume through alias | PASS | `0x94761f95bd48ceae26187faa39e6445c3e52f1bb5382ccea39a6b4db24ed0fc9` | Consumption 1 binds caller/context to cluster 1 and receipt timestamp |
| T15 duplicate simulation | PASS | No broadcast | Exact duplicate error; consumption count remains 1 |

Every successful write reached `FINALIZED`, `FINISHED_WITH_RETURN`, and `MAJORITY_AGREE`. Expected negative cases reached finalized semantic rollback and were followed by unchanged authoritative state. The two operator/tool encoding failures are retained above and in their individual evidence files; neither altered state and neither was hidden or replayed.

Final authoritative counts: proposals `6`, clusters `2`, consumptions `1`.
