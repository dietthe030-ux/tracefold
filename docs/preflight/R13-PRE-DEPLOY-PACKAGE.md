# Tracefold R13 PRE_DEPLOY package

Checkpoint: `PRE_DEPLOY`. Package ID: `TRACEFOLD-R13-DOCUMENTED-CLOCK-V3`. Exact technical/evidence revision: `a9ca684692993a69135f4e6b02e0ac56bd97a9c6`. Review carrier revision is supplied by the review request and may add only this package and its manifest.

R12 T01 on retired address `0xc9522C696a482CdCe5A12A684a814eeb575CbE3a` finalized and rolled back because the Studio host does not implement the SDK `GetTimestamp` call. Current official GenLayer transaction-context documentation states that `datetime.now(timezone.utc)` is wired to the deterministic transaction timestamp. R13 uses that documented clock in the shared helper and removes the test-only GetTimestamp shim. ABI, storage, constructor, trust boundary and product behavior are unchanged.

Hashes are SHA-256 over committed Git blob bytes at the technical revision:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `contracts/tracefold.py` | 50,472 | `85F6BDC602EBF5F8660D915233729ECE3B1CBE8E40EE4DA7BFA1BCE3325DC3B1` |
| `tests/test_tracefold.py` | 35,502 | `EE8442BEE072B6ED3C4F133A431955FBE223E71777DED599E163586649BA1EA9` |
| `tests/conftest.py` | 1,299 | `D3C56DA4FC2EDD4C645C258861AC1A93B623BFAC31E9444C9CFFAD4720DB948C` |
| `evidence/pre-deploy/r13-contract-tests.txt` | 871 | `0753FCDEADE00021470E14BA37CC3027299C0354487BF185A067CA3F62B5DEED` |
| `evidence/pre-deploy/r13-contract-lint.txt` | 105 | `BB4CDEE8975C51A0441D7101EFE5076B9E29217100AB33739C783C76D9310251` |
| `evidence/pre-deploy/r13-live-schema.json` | 5,605 | `29236167CC0FFCC6745FDA1A55BDF7AF23E0B79A33E2B245233CE277F5602FF2` |
| `evidence/studio/R12-T01-gettimestamp-fail.json` | 848 | `8F720BE3A24ADAA2D3FA71729867CC2D059AEBBF1AB0BE55CF539232A55F3A4C` |
| `docs/preflight/R13-CORRECTION-PLAN.md` | 1,259 | `258467A7E48534E89E63FC8C3B89A476024413B2777BFB47106FD75F10625046` |
| `evidence/studio/R13-STUDIO-E2E-PLAN.md` | 4,983 | `AFF2977850E847F6D97E3D0453AE7DA1050023DFB69A9B0A4912EA67D3071B12` |
| `evidence/studio/R13-datetime-now-corroboration.json` | 762 | `1FF2BDE1726631B778B658CED045800DD59296B0E092E274100D5190ED5D5AD8` |

Verification: 29/29 DirectVM tests PASS; genvm-lint 0.11.1rc2 lint/validation PASS with 20 methods; live Studio schema accepts the exact source. Read-only old-contract evidence proves live `datetime.now(timezone.utc)` stored `2026-09-15T18:43:43.685100Z`, equal to receipt `2026-09-15T18:43:43.685100+00:00`. Targeted fee simulation used a stale synthetic time, so R13 uses a generic fee estimate for retry and one explicit live rollback for the cooldown negative case.

The R13 matrix binds Studio Dev chain 61997, actor19, fresh `tf5-*` IDs, one broadcast per case, immediate hash lock, finality, semantic result, consensus and authoritative readback. Every older address and `tf3-*`/`tf4-*` operation is retired.

Return findings first and end with exactly one canonical PRE_DEPLOY verdict.
