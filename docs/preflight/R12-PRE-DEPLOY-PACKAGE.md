# Tracefold R12 PRE_DEPLOY review package

Checkpoint: `PRE_DEPLOY`. Package ID: `TRACEFOLD-R12-GENVM-TIMESTAMP-V1`. Exact immutable technical/evidence revision: `59e898509bc7007bf64d93963ff05ef82ccc71c8`. Its parent source-fix revision is `8b1beb58033ff173ea37259ca4bf74ad308aa894`; the later package-carrier commit may change only this package and its manifest. Review must reject if any allowlisted artifact differs between the technical revision and carrier commit.

## Defect and correction

T01 on retired contract `0x769f408F69fc2ef93f5D59853aba14FF4ef1226e` finalized and rolled back with `FINISHED_WITH_ERROR`: `Authoritative transaction datetime is unavailable`. The shared helper incorrectly read internal `gl.message_raw`. It now uses the official deterministic `gl.vm.get_timestamp()` API and normalizes the timezone-aware value to UTC ISO-8601. ABI, storage, constructor, actors, trust boundary and product behavior are unchanged.

## Hash policy and exact allowlist

Every hash below is SHA-256 of `git show 59e898509bc7007bf64d93963ff05ef82ccc71c8:<path>` bytes. This avoids Windows CRLF ambiguity. The contract is also byte-identical in the working tree because `.gitattributes` declares `contracts/*.py -text`.

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `contracts/tracefold.py` | 50,573 | `E20CB3BE22885CF92BFA91376EB615B6ACEB8DF024421EB19F29108D33315D2C` |
| `tests/test_tracefold.py` | 35,432 | `5F2515FA0C3D5EDCDBE51367E19D2C8C335B4F736B91D720C1FF6C365AFDBA8C` |
| `tests/conftest.py` | 2,628 | `7C4BC1E5401568F6F6D198E22D126545DB2BCDE9B7F119442BFB119DE57B309F` |
| `evidence/pre-deploy/r12-contract-tests.txt` | 870 | `B17A6EB565B8B7759DEA217CE5A414F65B96FE2733D385D5A159D9A45BC2AE7C` |
| `evidence/pre-deploy/r12-contract-lint.txt` | 105 | `BB4CDEE8975C51A0441D7101EFE5076B9E29217100AB33739C783C76D9310251` |
| `evidence/pre-deploy/r12-live-schema.json` | 5,605 | `69FF5EF35AC84050C8AC919398BDEB2857C5E36761234A9592A2718E7FA65228` |
| `evidence/studio/T01-failed-message-raw-time.json` | 605 | `40CEA25BF5F46572021ED12575EAEBF039C43662D0DBF3061AE24FED63878D1C` |
| `docs/preflight/R12-CORRECTION-PLAN.md` | 1,731 | `86CA66482574F14EAA8B825C192A8148296009E64277B72CFCDE91C1BE78B0D3` |
| `evidence/studio/R12-STUDIO-E2E-PLAN.md` | 4,588 | `5C303E71F7DEF5642723278E589F3690D85CC7C6A606CD6EC3D0D5372CAD60A0` |

The SHA-256 of this package's committed Git blob is recorded in `docs/preflight/R12-PACKAGE-MANIFEST.json`. The manifest also binds the carrier revision externally through the review request because a file cannot contain the hash of a commit that contains itself.

## Independently reproducible checks

- Exact Testing Suite venv: 29/29 DirectVM tests PASS, including authoritative time, unavailable host time, malformed current time and malformed persisted time without state mutation.
- `genvm-lint 0.11.1rc2`: lint and validation PASS, 3 checks, constructor plus 20 methods (14 view, 6 write).
- Live read-only Studio Dev schema: exact source accepted with 50,573 bytes and 20 methods.
- Runtime stdlib for the selected v0.6.0-rc5 bundle defines `gl.vm.get_timestamp()` as a timezone-aware transaction timestamp using the deterministic `GetTimestamp` host call.
- Exact failed transaction `0x390fe3a413e7fbbbb0521af2c2a9abb879820cdda2be2266248e19555b6a81d9`: `FINALIZED`, `FINISHED_WITH_ERROR`, `MAJORITY_AGREE`, matching actor/contract and exact rollback payload. Counts remained zero.

## Deployment authorization boundary

The R12 matrix is `evidence/studio/R12-STUDIO-E2E-PLAN.md`, bound to this source, actor19, Studio Dev chain 61997 and fresh `tf4-*` operation IDs. All older addresses and every `tf3-*` operation are retired and receive no further writes. A fresh deployment may occur only after approval of the exact package carrier; each write is estimated once, broadcast once, immediately hash-locked, finalized, semantically checked and authoritatively read back.

Reviewer must inspect the exact artifacts and return findings first. End with exactly `ANONYMOUS REVIEW APPROVED - PRE_DEPLOY`, `ANONYMOUS REVIEW CHANGES REQUIRED - PRE_DEPLOY`, or `ANONYMOUS REVIEW REJECTED - PRE_DEPLOY`.
