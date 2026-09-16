# Tracefold R13 Vercel browser-wallet E2E result

**Status: PASS**

## Exact release

- Production: <https://tracefold-gamma.vercel.app>
- Frontend commit: `f757ef5e41c49629946a2966a26fae14ddf40459`
- Vercel deployment: `dpl_2ATsgnXhW7fkqvXZBZWbDhNp97DA`
- Public immutable deployment URL: <https://tracefold-13fnjnbgi-dietthe030-uxs-projects.vercel.app>
- Contract: `0x8A9c3Ae6521a1d452253F640a615937c6cf9d00D`
- Network: Studio Dev, chain `61997`
- Wallet provider/account: OKX Wallet / `0x2DEaCd841181b0ad9676bc55628e694f358944ED`

## Transaction proof

One proposal transaction was broadcast, with no resubmission or blind retry.

| Field | Verified value |
|---|---|
| Nonce | `vercel-r13-a11771f` |
| Identifiers | `CVE-2024-3094`, `GHSA-42XW-2XVC-CX4X` |
| Transaction | `0x7ac8627b06381fd029d995f8f63c04a38fa7a127a7137a70f07770413bfa5073` |
| Lifecycle | `FINALIZED` |
| Execution | `FINISHED_WITH_RETURN` |
| Consensus | `MAJORITY_AGREE` |
| Authoritative nonce readback | proposal `7` |
| Proposal readback | `PROPOSED`, exact two canonical identifiers, correct proposer |
| Counts | proposals `6 → 7`; clusters `2`; consumptions `1` |

Reload recovery reconciled proposal `7` and the same authoritative state without broadcasting another transaction. Resolving `CVE-2024-26130` returned cluster `1` in both the UI and direct contract readback.

## Browser journeys

- The two-layer landing page, central GenLayer/Tracefold taijitu, documentation, workspace transition, keyboard navigation, focus states, and reduced-motion styling passed.
- EIP-6963 provider selection connected the chosen OKX Wallet account on chain `61997` and displayed the exact contract.
- A deliberately invalid incident context was rejected during validation/simulation before broadcast. The UI reported **Transaction not sent**, returned no hash, opened no wallet prompt, and preserved all counts.
- Transaction notices have a close control; terminal success notices also dismiss automatically after eight seconds.
- Automated release checks passed: frontend `81/81`, TypeScript, and production build.

The successful transaction ran on `a11771f5b47d9d1fd844b4a6ed41e774ed586859`. The deployed frontend tree at `f757ef5` is byte-identical to `f757ef5`; `rpcClient.ts`, `pendingTxStore.ts`, and `ProposeAliasSet.tsx` remain byte-identical to the tested transaction release.

## Limits

- Initial Studio Dev registry synchronization took approximately 15–20 seconds before authoritative counts rendered.
- Studio Dev is a development network and may reset.

The machine-readable result is [`R13-VERCEL-E2E-RESULT.json`](R13-VERCEL-E2E-RESULT.json). Public alias/deployment byte parity is recorded in [`R14-VERCEL-DEPLOYMENT-BINDING.json`](R14-VERCEL-DEPLOYMENT-BINDING.json).
