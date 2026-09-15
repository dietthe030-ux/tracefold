# Studio E2E fee authorization

Historical authorization for the invalidated `df837d5` source/address only. Do not reuse it for a corrected-source deployment or E2E.

The user replied exactly `Xác nhận Studio E2E` in the Tracefold build Task after receiving the bounded request recorded in `STUDIO-E2E-FEE-AUTHORIZATION-REQUEST.md`.

This authorizes the listed Studio E2E matrix only: no more than 13 fee-bearing operations, no fee deposit above 0.25 GEN for one operation, and no cumulative fee deposits above 3.25 GEN. Each operation still requires a fresh estimate submitted unchanged, a stable operation ID, one broadcast, finalized receipt inspection and authoritative readback. It does not authorize a different contract, network, account, deployment, upgrade, GitHub/Vercel target, or Vercel browser-wallet E2E.
