# Tracefold R13 POST_DEPLOY_TEST review package

Package ID: `TRACEFOLD-R13-POST-DEPLOY-V3`

Evidence revision: `ca744d3254027bd79e8d9fe4b54eafd8b53b2b49`

Review checkpoint requested: `POST_DEPLOY_TEST`.

## Exact release candidate

- Contract source: `contracts/tracefold.py`
- Source commit: `dd96d6eea0faaf36ea8e1c269d5bc57aeeeed863`
- Source SHA-256: `85F6BDC602EBF5F8660D915233729ECE3B1CBE8E40EE4DA7BFA1BCE3325DC3B1`
- Release contract: `0x8A9c3Ae6521a1d452253F640a615937c6cf9d00D`
- Deploy tx: `0x30bbbef5527625cc49d0ca622328cf426c5136bbabd72c2fec076ee537cf7ec4`
- Network: Studio Dev / chain 61997
- Deployer/upgrader: `0x9ec6a971ff91c7540cce6432e7abf7ece005d5a5`

## Verification result

- DirectVM: 29/29 PASS.
- `genvm-lint 0.11.1rc2`: lint, validation, schema PASS; 20 methods (14 view, 6 write).
- Frontend: 77/77 tests PASS; TypeScript PASS; production build PASS.
- On-chain source: 50,472 bytes and byte-identical to local source.
- Live matrix: T00–T15 completed. Positive writes are FINALIZED + FINISHED_WITH_RETURN + MAJORITY_AGREE with authoritative readbacks. Negative cases have exact rollback plus unchanged state.
- Final state: 6 proposals, 2 clusters, 1 consumption.
- Vercel browser-wallet E2E is specified in `evidence/vercel/R13-VERCEL-E2E-PLAN.md`. It is deliberately unexecuted until the exact production release is bound and the user authorizes starting that gate.

The ledger retains two non-product operator/tool failures. T08 first used the nonexistent method `propose_alias`, finalized with semantic error, and left counts unchanged; the approved ABI call then passed. T14 first exposed CLI 0.40.0-rc.3 coercing numeric-looking scalar string `"1"` to integer `1`; it finalized with semantic error and left consumption count zero. A new corrected vector used the existing nonnumeric alias `CVE-2024-26130`, proving alias resolution to cluster 1 and consumption, then the duplicate simulation rejected without broadcast. No source, constructor, address, or material configuration changed.

## Artifact bindings

- `contracts/tracefold.py`: `85F6BDC602EBF5F8660D915233729ECE3B1CBE8E40EE4DA7BFA1BCE3325DC3B1`
- `evidence/studio/R13-STUDIO-E2E-LEDGER.md`: `F343CF3631AD8220807CEF5A8C4EA1D05EB9222FB71D429B2580103D292C30F1`
- `evidence/studio/R13-DEPLOYMENT-RECOVERY-MANIFEST.md`: `3FE507266864D9737707BCAC586367C12D8D9024291E71A5EC15C90AA3400417`
- `evidence/studio/R13-T00-deployment.json`: `FABD9DDFBCF652A17A1AEE109DEE697BF9E8E0D908B991008E8149EA9A6971D8`
- `evidence/studio/R13-T10-cooldown-negative.json`: `AC3970478A4E1FF3F78B1BFE891595509FF3116D4C5EA756BDF7B5867DC62082`
- `evidence/studio/R13-T11-cooldown-expiry.json`: `F6F560883D71509700EDB1AE2B2E705E56B751A1B727A4DE5A94E1581613291E`
- `evidence/studio/R13-T14-consume.json`: `FAB979ADBAC9B4C13C8515706136E2F3859463B521BB98781F454937BB2676CD`
- `evidence/studio/R13-T15-duplicate-consume-simulation.json`: `695E5C142A39F7DAF85147AFDD44E104061492085168DDE9AA74CCB6B19B5689`
- `evidence/studio/R13-final-source-parity.json`: `B561A467A6247F6ADB42C5B77633F2F9368B369409E063D1C1D457A9E0650743`
- `evidence/vercel/R13-VERCEL-E2E-PLAN.md`: `083C0E1F7ADE64E545A6BC25EC61D043D3EF73AAC19DD83DBE01837BEACF0C83`

Reviewer must inspect exact evidence revision and every bound artifact, verify the retained failures and their unchanged-state proof, and return exactly one final line: `ANONYMOUS REVIEW APPROVED - POST_DEPLOY_TEST` or `ANONYMOUS REVIEW CHANGES REQUIRED - POST_DEPLOY_TEST`.
