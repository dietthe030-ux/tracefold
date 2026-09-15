# R04 source-outage matrix correction

R04 finalized safely as UNRESOLVED because GHSA returned HTTP 403 while NVD returned 200. It is retained as source-outage/fail-closed evidence and is not counted as second-cluster proof. No retry is sent.

Replacement pair: `CVE-2024-26130` and `PYSEC-2024-225`. Read-only preflight returned exact NVD ID/status 200 and exact OSV ID/status 200; OSV explicitly lists CVE-2024-26130 as an alias and one `cryptography` package. R04A proposes the pair with operation `tf2-r04a-propose-osv-alias`; R04B assesses it with `tf2-r04b-assess-osv-alias`. The user delegated all Studio decisions and fees to the primary AI, so these two source-outage replacement operations are within the authorized Studio correction scope.

R05 will use `CVE-2021-44228` from cluster 1 plus `PYSEC-2024-225` from cluster 2 to prove the same cross-cluster conflict invariant without depending on the unavailable GHSA endpoint.
