ANONYMOUS REVIEW CHANGES REQUIRED - PRE_DEPLOY

Package ID: TRACEFOLD-PREDEPLOY-67E01FA
Revision: 67e01fa08af719521b1052206ef8de6550cc6fbe
Reviewer Task ID: 01a0a536-2f73-7ed1-b962-9f40520d4e77
openBlockingFindings: 1

The retained reviewer independently recomputed the candidate and evidence hashes, reran the read-only live schema check, and confirmed chain 61997, actor balance, zero writes, 25/25 contract tests, 77/77 frontend tests, typecheck and build.

F-01 through F-07 were closed. F-08 remained: the unavailable/insufficient-evidence branch computed a reduced fingerprint instead of using the canonical final-field helper. Required correction was to construct the full early result, call `_assessment_fingerprint(result)`, and independently reproduce that hash in an unavailable-source regression while checking latest/history consistency.

The disclosed unreachable `run_nondet` marker was accepted as a non-blocking compatibility item for this exact linter/runtime pair.

Scope boundary: PRE_DEPLOY only; no deploy/live-E2E/release approval.
