# Tracefold

Tracefold is an independent GenLayer application for resolving CVE, GHSA, and OSV aliases into conservative, evidence-backed vulnerability clusters. Validators compare live public records; the contract keeps uncertainty, objections, conflicts, source revisions, and a bounded assessment history visible.

## Product layers

- **Story layer:** an editorial introduction, method, design principles, and field guide.
- **Operational layer:** cluster search, proposal creation, consensus assessment, objections, exact-once incident consumption, and release diagnostics.

## Contract behavior

`contracts/tracefold.py` normalizes identifiers, prevents duplicate nonce and identifier-set proposals, fetches bounded public evidence inside GenLayer nondeterministic execution, and applies deterministic consequences. A merge needs sufficient successful sources and compatible package evidence. Active objections prevent cluster mutation. Proposals that bridge existing clusters become explicit `CONFLICT` records; the existing clusters remain unchanged.

The deployment is fresh. No storage, contract address, wallet state, receipt, network assumption, or reviewer approval from the reference project is reused.

## Current toolchain

- GenVM `v0.6.0-rc5`
- contract dependency `py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng`
- `genlayer-js@2.0.0-rc.1`
- Studio Devnet, chain `61997`
- RPC `https://studio-dev.genlayer.com/api`

## Local checks

```powershell
$env:GENVM_VERSION='v0.6.0-rc5'
$env:PYTHONUTF8='1'
E:\Genlayer-Tools\studio-next-toolchain\.venv\Scripts\genvm-lint.exe contracts\tracefold.py
E:\Genlayer-Tools\studio-next-toolchain\.venv\Scripts\python.exe -m pytest -q

Set-Location frontend
npm ci
npm test
npm run typecheck
npm run build
```

Copy `frontend/.env.example` to `frontend/.env.local` only after a fresh deployment and set the new Tracefold address. Never commit environment files.

## Transaction truth

The browser estimates fees for the exact write and passes the estimate into the signed transaction. Once a hash exists, Tracefold journals it and never retries blindly. Success requires `FINALIZED`, successful GenVM execution, and method-specific authoritative readback. Ambiguous timeouts remain reconcilable under the original hash.

See [the architecture and trust model](docs/ARCHITECTURE.md), [the user guide](docs/USER-GUIDE.md), and [the evidence schema](docs/TRACEFOLD-E2E-EVIDENCE-SCHEMA.md).
