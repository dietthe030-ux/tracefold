# Tracefold milestone baseline

Task: tracefold-2026-09-15. Independent project. Old project is read-only reference.
Status: BASELINED for source/Git/public app; historical Studio/Vercel claims remain unverified until authoritative access/readback is checked.

## Exact old revision

- Folder: `E:\Genlayer-Projects\vulnerability-alias-merge-registry`.
- Checkout: `master`, clean `git status --porcelain`; HEAD and `origin/master` both `690a94d9efe24f7334511b821adc0035639f8f0f` on 2026-09-15.
- Public GitHub commit exists: https://github.com/an8442780-debug/vulnerability-alias-merge-registry/commit/690a94d9efe24f7334511b821adc0035639f8f0f.
- Contract source `contracts/vulnerability_alias_merge_registry.py` SHA-256 `8CF6A922A18078B173F99F33B82A887C33F9C61D053F793203903F10CC97F522`; it matches the hash in old `docs/PRE_DEPLOY.md` and `docs/EVIDENCE-MANIFEST-POST_DEPLOY-2026-08-29.md`. This verifies local source-to-manifest consistency, not independent deployed-byte parity.
- Public old app returned HTTP 200 with title `VAMR — Vulnerability Alias Merge Registry` on 2026-09-15. This verifies reachability/title, not exact live bundle or wallet E2E.

## Mechanism and trust boundary

The contract canonicalizes CVE/GHSA/OSV identifiers, accepts at most three identifiers per proposal, indexes nonce and ID set for duplicate prevention, and rejects a proposal spanning two existing clusters. A proposal is `PROPOSED`; assessment fetches NVD/GHSA/OSV projections and asks a model for `SAME_VULNERABILITY`, `RELATED_NOT_SAME`, `DISTINCT`, or `UNRESOLVED`. External record text is labelled untrusted in the prompt. Deterministic consequence guards require at least two successful sources and non-conflicting relation evidence before a same-vulnerability result may mutate a cluster. Validators independently evaluate and compare consequence fields. Unavailable/contradictory evidence can remain `UNRESOLVED`; retries are capped at three and cooled down for 600 seconds. Objections are bounded at eight but the old assessment record retains only the latest assessment. Incident consumption is caller/context/cluster exact-once.

The chain's finalized state and contract views are authoritative. Source responses and model output are untrusted; frontend local storage is transaction-recovery intent, not contract truth. Assessment decisions can append identifiers to one cluster or create a cluster. The storage layout comprises counters, proposal/cluster/objection/consumption TreeMaps, alias index and upgrader address. Constructor optionally takes an upgrader address and otherwise uses sender; Root Slot upgrade path is guarded by that address. A fresh Tracefold deployment needs a fresh constructor actor and storage; no old state migration is planned.

Public methods in old source: writes `upgrade`, `propose_alias_set`, `record_objection`, `assess_proposal`, `retry_unresolved`, `consume_incident`; views `get_upgrader`, `get_counts`, `get_proposal`, `get_latest_assessment`, `get_cluster`, `resolve_alias`, `is_consumed`, paged proposals/clusters/objections and `get_proposal_by_nonce`.

## Product journeys and evidence boundary

Old frontend offers wallet connection, proposal, assessment tracker, objection, cluster explorer, incident consumer and diagnostics. EIP-6963 accepts MetaMask/OKX/Rabby. Old client fixes Studionet 61999 and `https://studio.genlayer.com/api`, uses `genlayer-js` 1.1.8, polls transaction state and uses method-specific readbacks. Old contract source header pins a historical py-genlayer dependency.

Old source has 20 named DirectVM contract tests covering validation, nonce/idempotency, objection caps, positive/negative assessment, source outage, injection, validator disagreement, upgrade authority, views and boundary lengths. Frontend source has wallet, RPC, persistence, validation and component tests. Old documentation reports 20 DirectVM and 49 Vitest PASS; the tests were inspected but not rerun in the old checkout because a run may write caches there. Old `docs/POST_DEPLOY_TEST_2026-08-29.md` records finalized proposal, assessment, objection, consumption, rollback and upgrade-rehearsal transactions and readbacks on Studionet 61999. These are historical claims; they do not satisfy Tracefold E2E. Old evidence names contract `0x41646E6972CcF5e2aCb299A26Ae18bcb3A67cd7E`, deploy tx `0xb3176a9ef49d1eae96b030cdd88db80b523e754bd3853b614516bf83ff44067a`, and old Vercel URL. They are explicitly excluded from Tracefold runtime config and proof.

Old limitations: fixed capacities (256 proposals, 128 clusters, 10 aliases/cluster, 8 objections/proposal, 512 consumptions), two-cluster merge rejection, source outages/contradictions yielding unresolved, 600-second retry, only latest assessment visible, old network/toolchain, and non-blocking Vite chunk warning reported in old docs. Submission history shows an old PRE_SUBMISSION response; no old approval transfers to this Task. Historical Vercel provider provenance and deployed-code parity still require independent read-only verification if used as before/after claims.

## Inheritance rule

Tracefold may reuse only the recognizable trust problem, source-design ideas and selected read-only source excerpts. It must implement and prove its own contract, storage, ABI, SDK/runtime compatibility, wallet flow, tests, Studio Dev deployment, source parity, GitHub/Vercel release, judge evidence, reviewer approvals and submission. No old wallet, nonce journal, contract address, RPC/network configuration, fee assumption, secret, approval or external target is copied.
