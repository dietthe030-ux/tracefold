# Tracefold R13 Vercel browser-wallet E2E plan

Status: **PASS**. Executed against the exact production binding below. See [`R13-VERCEL-E2E-RESULT.md`](R13-VERCEL-E2E-RESULT.md).

## Release binding

- Contract: `0x8A9c3Ae6521a1d452253F640a615937c6cf9d00D`
- Network: Studio Dev (`studio-dev`, chain `61997`)
- Canonical RPC: `https://studio-dev.genlayer.com/api`
- Contract source SHA-256: `85F6BDC602EBF5F8660D915233729ECE3B1CBE8E40EE4DA7BFA1BCE3325DC3B1`
- Frontend release commit: `f757ef5e41c49629946a2966a26fae14ddf40459`
- Production URL: <https://tracefold-gamma.vercel.app>
- Vercel deployment: `dpl_929cdbsVPiT8aDGfQwkvJjoMfcAV`

## Controlled execution

- Primary AI controls one browser tab and one selected EIP-6963 wallet session; the user performs only wallet approval/signing when the wallet requires it.
- Confirm the production URL, release commit, contract address, chain ID and RPC before the first transaction.
- Retain one operation ID and transaction hash per write. Observe that hash to a terminal result; never resubmit because polling is slow or ambiguous.
- Stop on an unexpected semantic result, consensus result, address, network or release mismatch. Diagnose and repair the release as one coherent change before any new E2E run.

## Judge-facing journeys

1. **Layer 1:** load the production landing page; verify the two-hand hero, central taijitu with the GenLayer and Tracefold marks, navigation, documentation, live summary, responsive layout, keyboard navigation, reduced-motion behavior and readable focus states.
2. **Layer transition:** enter the Layer 2 workspace through the primary call to action and verify that no wallet request occurs before the user chooses a wallet action.
3. **Wallet and network:** select the intended EIP-6963 provider, connect the intended account, verify or switch to chain `61997`, and confirm the UI displays the deployed Tracefold address.
4. **Authoritative reads:** read counts, proposal pages and cluster pages; resolve `CVE-2024-26130` to cluster `1`; compare the UI result with a direct authoritative readback.
5. **Fresh proposal write:** first confirm the proposal count is `6`, then submit nonce `vercel-r13-<release-short-sha>` with the unused pair `CVE-2024-3094` and `GHSA-42xw-2xvc-cx4x`. Confirm one wallet prompt, one returned hash, FINALIZED status, semantic success, consensus success, nonce readback resolving to new proposal `7`, status `PROPOSED`, the exact two canonical IDs, and proposal count `7`. Do not assess this proposal or submit the nonce a second time during this gate.
6. **Recovery:** reload after retaining the transaction hash and verify the pending-operation recovery path reconciles the same hash and readback without broadcasting another transaction.
7. **Failure UX without broadcast:** enter an invalid or duplicate incident-consumption request and verify fee simulation or local validation reports the failure without a transaction broadcast.

## Evidence to capture

- Production URL, Vercel deployment ID, Git commit and build timestamp.
- Browser viewport and wallet/provider identity without exposing secrets.
- Network/contract configuration and direct read parity.
- For the write: operation ID, transaction hash, terminal status, semantic result, consensus result, proposal counts before/after and authoritative nonce/proposal readback for proposal `7`.
- RPC counts, polling attempts, cache/dedupe behavior and transaction count appended to `docs/RPC-BUDGET.md`.
- Screenshots of Layer 1, Layer 2, wallet/network state, terminal success and recovery state.

## Pass condition

PASS requires the exact production release to complete every journey above, with one transaction for the proposal journey, no blind retry, FINALIZED plus semantic and consensus success, authoritative readback, and a complete RPC evidence row set. Presentation-only changes retain transaction proof when the transaction path is byte-identical and the final release is independently rebuilt and checked.
