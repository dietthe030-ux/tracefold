# Tracefold

Tracefold is a GenLayer application that reconciles CVE, GHSA, and OSV identifiers into conservative, evidence-backed vulnerability clusters.

- **Live app:** added after the matching Vercel release is deployed
- **Contract:** [`0x8A9c3Ae6521a1d452253F640a615937c6cf9d00D`](https://explorer-studio-dev.genlayer.com/address/0x8A9c3Ae6521a1d452253F640a615937c6cf9d00D)
- **Network:** Studio Dev, chain `61997`
- **Source SHA-256:** `85F6BDC602EBF5F8660D915233729ECE3B1CBE8E40EE4DA7BFA1BCE3325DC3B1`

## The trust problem

Public security databases can describe the same flaw under different IDs, packages, and timelines. A proposer may be mistaken or biased, a single API may be unavailable, and a frontend cannot be trusted to declare a merge. A wrong merge can hide exposure or cause downstream systems to count the same vulnerability twice.

## Why GenLayer

Tracefold uses an Intelligent Contract because identifier equivalence cannot always be derived from one deterministic field. During assessment, validators independently retrieve bounded public records from NVD, GitHub Advisory Database, and OSV, interpret their package and alias evidence, and compare stable consequence fields. The contract records `MERGED`, `KEPT_SEPARATE`, `UNRESOLVED`, or `CONFLICT` only after consensus. Missing, contradictory, or unverifiable evidence fails closed.

## How it works

1. A researcher proposes one CVE plus optional GHSA/OSV aliases with an idempotency nonce.
2. Validators assess official public records. Active objections prevent a merge, and a proposal spanning two clusters becomes an explicit conflict instead of silently joining them.
3. Researchers inspect the assessment, source status, fingerprint, objections, conflicts, and bounded history.
4. An incident system consumes a resolved cluster exactly once for a caller/context/cluster tuple.

The public site has two layers: an editorial story and documentation layer, then a wallet-connected operational workspace for search, proposals, assessment, objections, and incident consumption.

## Architecture and source of truth

- `contracts/tracefold.py` owns proposal, assessment, conflict, cluster, objection, consumption, nonce, retry, and upgrader state.
- `frontend/` discovers EIP-6963 wallets, estimates the exact write fee, submits one transaction, observes finality, checks semantic execution, and verifies method-specific contract readback.
- NVD, GitHub Advisory Database, and OSV are authoritative only for their own public records. Their text is treated as untrusted data.
- Contract storage is authoritative for Tracefold state. The browser never turns a submitted hash or UI state into proof.

See [Architecture and trust model](docs/ARCHITECTURE.md) and the [User guide](docs/USER-GUIDE.md).

## Intelligent Contract

The constructor receives one `upgrader_address`. The deployed upgrader is `0x9ec6a971ff91c7540cce6432e7abf7ece005d5a5`. The main write methods are `propose_alias_set`, `record_objection`, `assess_proposal`, `retry_unresolved`, `consume_incident`, and `upgrade`.

`PROPOSED` may become `MERGED`, `KEPT_SEPARATE`, `UNRESOLVED`, or `CONFLICT`. Unresolved assessments have bounded retries and a cooldown. Validators refetch evidence independently and must agree on every consequential field. Tracefold has no token, payout, or protocol revenue model.

## Transaction lifecycle

Before signing, the browser stores the intended method, arguments, caller, and authoritative pre-state and estimates the exact fee. After the wallet returns a hash, the app retains that hash and never resubmits automatically. Success requires lifecycle `FINALIZED`, successful GenVM execution, consensus success, and the exact contract readback expected for that method.

Timeouts remain `RECONCILING` under the original hash. Semantic errors are shown as failures even when the transaction finalized.

## Run locally

Requirements: Node.js 20+, npm, and a compatible EIP-6963 wallet for write flows.

```powershell
Set-Location frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

The example environment targets Studio Dev and the deployed Tracefold contract. Do not commit `.env.local`.

Contract verification uses the current GenLayer RC toolchain:

```powershell
$env:GENVM_VERSION='v0.6.0-rc5'
$env:PYTHONUTF8='1'
E:\Genlayer-Tools\studio-next-toolchain\.venv\Scripts\genvm-lint.exe contracts\tracefold.py
E:\Genlayer-Tools\studio-next-toolchain\.venv\Scripts\python.exe -m pytest -q
```

## Tests and verification

```powershell
Set-Location frontend
npm test
npm run typecheck
npm run build
```

Current release results: DirectVM `29/29`, frontend `77/77`, TypeScript PASS, production build PASS, and `genvm-lint 0.11.1rc2` lint/validation/schema PASS with 20 public methods. The Studio matrix covers merge, conflict, objection guard, unavailable sources, cooldown rejection and recovery, distinct records, alias resolution, exact-once consumption, rollback, and source parity.

See [Verification](docs/VERIFICATION.md) for exact deployment and evidence bindings.

## Deployment and recovery

The contract was freshly deployed on Studio Dev from 50,472 source bytes. `gen_getContractCode` is byte-identical to `contracts/tracefold.py`. The deployment is upgradable only by the constructor-bound upgrader. If local UI state is lost, reconnect to the recorded address and reconcile retained transaction hashes before any write. If Studio Dev resets, redeploy the exact source through a new governed release and update every public binding.

## Security boundaries

- User-provided identifiers select a bounded case; they do not supply authoritative truth.
- Source URLs are constructed and allowlisted by the contract.
- Retrieved content is untrusted and cannot change prompts, schemas, or consequences.
- Missing, malformed, ambiguous, conflicting, or unavailable evidence produces `UNRESOLVED`.
- Notes, identifiers, lists, history, retries, and responses are bounded.
- Wallet, chain, account, and contract changes invalidate cached state and pending assumptions.

## Known limitations

- Studio Dev is a development network and may reset.
- Public source availability and rate limits can cause a conservative `UNRESOLVED` result.
- Assessment history is intentionally capped at three snapshots per proposal.
- Tracefold does not automatically merge two existing clusters; it records a conflict for review.
- The production Vercel URL and browser-wallet E2E evidence are added only after the exact release is deployed and tested.
