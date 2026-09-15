# Implementation change log

- Created a fresh `Tracefold` contract and storage namespace from the verified reference logic; no runtime state or deployment identity was copied.
- Added bounded assessment history, explicit cross-cluster `CONFLICT` records, and an objection guard that prevents cluster mutation.
- Adapted the contract to GenVM v0.3, current storage types, Studio Devnet, and a fresh constructor/upgrader boundary.
- Built a new two-layer visual system: editorial story/docs first, operational evidence workspace second.
- Replaced legacy wallet booleans with one reducer covering discovery, chooser, connection, wrong-chain recovery, account changes, disconnect, and write-provider eligibility.
- Added canonical wallet discovery cardinality, canonical local wallet presentation, exact provider binding, explicit network recovery, and fee/balance validation.
- Added durable single-flight write intents, exact fee estimates, hash preservation, current SDK finalization, semantic execution checks, authoritative readback, and reconciliation without resubmission.
- Added canonical public transaction phases, accessible live status, visible hash/copy controls, terminal failure/rejection states, and recovery action.
- Added focused contract, validator-disagreement, wallet, RPC, fee, transaction-phase, component, responsive, and production-build verification.

Mechanical corrections made during implementation: renamed copied local storage/nonce keys, restored Tailwind's PostCSS pipeline after visual QA exposed missing utility output, corrected the assessment-history ABI arguments from the live schema, and separated the GenLayer SDK bundle from application code.

The R11 Studio cooldown probe exposed a runtime-clock defect: `_get_current_datetime()` preferred the Python runner wall clock over GenLayer's transaction timestamp. The correction makes `gl.message_raw["datetime"]` the sole write-time authority and fails closed when it is absent. The DirectVM compatibility shim now supplies the same raw timestamp boundary during tests, and a fixed historical timestamp regression proves that host wall time cannot override transaction time. Public ABI, storage layout, actor authority and product states are unchanged.

PRE_DEPLOY review corrections: aligned all objection reason codes and the primary CVE field with the contract ABI; made package identity deterministic over ecosystem plus name; prevented model output from strengthening package/cross-reference evidence; recomputed the fingerprint after the objection guard; stored final assessment history after cluster assignment; added bounded authoritative consumption history; and bound every frontend write readback to an exact pre/post state delta. The RPC matrix now describes the implemented 5-second/24-attempt finality observation and actual no-auto-retry read behavior.

The correction review found one remaining early-return inconsistency. The unavailable/insufficient-evidence branch now uses the same final-field fingerprint helper as every other assessment path, with an independent hash-reproduction regression.
