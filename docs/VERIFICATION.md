# Tracefold verification

## Exact release

- Release source commit: `dd96d6eea0faaf36ea8e1c269d5bc57aeeeed863`
- Contract source SHA-256: `85F6BDC602EBF5F8660D915233729ECE3B1CBE8E40EE4DA7BFA1BCE3325DC3B1`
- Contract source bytes: `50,472`
- Contract: `0x8A9c3Ae6521a1d452253F640a615937c6cf9d00D`
- Deployment transaction: `0x30bbbef5527625cc49d0ca622328cf426c5136bbabd72c2fec076ee537cf7ec4`
- Explorer: <https://explorer-studio-dev.genlayer.com/address/0x8A9c3Ae6521a1d452253F640a615937c6cf9d00D>
- Network/RPC: Studio Dev, chain `61997`, `https://studio-dev.genlayer.com/api`
- Constructor: `upgrader_address=0x9ec6a971ff91c7540cce6432e7abf7ece005d5a5`
- Live app: pending the matching Vercel release

The deployment reached `FINALIZED`, `FINISHED_WITH_RETURN`, and `MAJORITY_AGREE`. `gen_getContractCode` returned 50,472 bytes byte-identical to the committed contract source.

## Automated checks

| Check | Command | Result |
|---|---|---|
| Contract behavior | `python -m pytest -q` with the project GenLayer test environment | 29/29 PASS |
| Contract lint/schema | `genvm-lint contracts/tracefold.py` | PASS; 20 methods, 14 view, 6 write |
| Frontend | `npm test` | 77/77 PASS |
| TypeScript | `npm run typecheck` | PASS |
| Production bundle | `npm run build` | PASS |

## Live Studio proof

The R13 matrix starts with 0 proposals, 0 clusters, and 0 consumptions and finishes with 6 proposals, 2 clusters, and 1 consumption. Positive writes require finality, semantic success, consensus, and authoritative readback. Negative writes prove exact rollback and unchanged state.

| Cases | Proof |
|---|---|
| Deployment and source parity | [`R13-T00-deployment.json`](../evidence/studio/R13-T00-deployment.json), [`R13-final-source-parity.json`](../evidence/studio/R13-final-source-parity.json) |
| Supported merge | [`R13-T01-proposal.json`](../evidence/studio/R13-T01-proposal.json), [`R13-T02-assessment.json`](../evidence/studio/R13-T02-assessment.json) |
| Conflict across clusters | [`R13-T04-conflict.json`](../evidence/studio/R13-T04-conflict.json) |
| Objection guard | [`R13-T06-objection.json`](../evidence/studio/R13-T06-objection.json), [`R13-T07-objection-guard.json`](../evidence/studio/R13-T07-objection-guard.json) |
| Unavailable source and cooldown | [`R13-T09-unavailable-assessment.json`](../evidence/studio/R13-T09-unavailable-assessment.json), [`R13-T10-cooldown-negative.json`](../evidence/studio/R13-T10-cooldown-negative.json), [`R13-T11-cooldown-expiry.json`](../evidence/studio/R13-T11-cooldown-expiry.json) |
| Distinct records | [`R13-T12-distinct-proposal.json`](../evidence/studio/R13-T12-distinct-proposal.json), [`R13-T13-distinct-assessment.json`](../evidence/studio/R13-T13-distinct-assessment.json) |
| Alias consumption and duplicate prevention | [`R13-T14-consume.json`](../evidence/studio/R13-T14-consume.json), [`R13-T15-duplicate-consume-simulation.json`](../evidence/studio/R13-T15-duplicate-consume-simulation.json) |

The complete case/result index is [`R13-STUDIO-E2E-LEDGER.md`](../evidence/studio/R13-STUDIO-E2E-LEDGER.md). Recovery and upgrade bindings are in [`R13-DEPLOYMENT-RECOVERY-MANIFEST.md`](../evidence/studio/R13-DEPLOYMENT-RECOVERY-MANIFEST.md).

## Known limitations

- Studio Dev may reset; the recorded address is not a permanent mainnet deployment.
- Public source outages and ambiguity deliberately resolve to `UNRESOLVED`.
- Browser-wallet production evidence remains pending until the exact Vercel deployment is available.
