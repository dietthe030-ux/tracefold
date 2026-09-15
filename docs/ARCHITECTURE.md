# Architecture and trust model

## Authority boundaries

- NVD, GitHub Advisory Database, and OSV are authoritative for their own published records. Their text is untrusted data and never supplies instructions.
- GenLayer validator consensus adjudicates the bounded comparison package. It does not make a missing source true.
- Contract storage is authoritative for proposals, assessment snapshots, conflicts, clusters, objections, consumption receipts, and the upgrader.
- The frontend is a client. It validates inputs and reports progress, but only finalized execution plus contract readback proves a state change.

## State transition

`PROPOSED` can become `MERGED`, `KEPT_SEPARATE`, `UNRESOLVED`, or `CONFLICT`. `UNRESOLVED` can be retried within the attempt and cooldown bounds. An active objection converts an otherwise mergeable result to `UNRESOLVED` without mutating a cluster. A proposal spanning two existing clusters becomes `CONFLICT`; Tracefold records the conflicting cluster IDs and preserves both clusters.

Assessment history is capped at three snapshots per proposal. Lists, responses, notes, identifiers, retries, objections, proposals, clusters, and consumption records are bounded to limit storage and RPC cost.

## Recovery

Writes use a durable intent journal. Before signing, the client estimates the exact write fee. After submission it saves the transaction hash, waits for GenLayer finalization, checks semantic execution, and verifies the expected contract consequence. A timeout or unavailable RPC retains the hash as `RECONCILING`; the app checks the same operation after reload and never creates a replacement write automatically.

The upgrade entry point is restricted to the constructor-provided upgrader address. A new deployment must set that address explicitly and document it in the release evidence.
