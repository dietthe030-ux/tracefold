# Tracefold user guide

1. Open **Workspace** and inspect existing clusters or search an identifier.
2. Connect MetaMask, OKX Wallet, or Rabby. Tracefold shows the selected wallet name and shortened address and asks for the supported GenLayer network when needed.
3. Propose one CVE and optional GHSA/OSV aliases. The generated client nonce prevents accidental duplicate submission.
4. Assess the proposal. Validators fetch bounded current records and return one conservative outcome.
5. Inspect the latest report, source coverage, fingerprint, conflict details, and the three-entry history.
6. File an objection when package, release, ecosystem, vendor, attribution, or version-range evidence disputes a merge.
7. Consume a resolved cluster for an incident context exactly once. Reusing the same caller/context/cluster tuple is rejected.

Keep the tab open while a write is finalizing. If the RPC becomes unavailable after a hash appears, do not submit again. Reloading Tracefold reconciles the saved transaction by its original hash.
