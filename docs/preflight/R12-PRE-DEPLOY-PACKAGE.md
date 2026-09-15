# Tracefold R12 PRE_DEPLOY review package

Review checkpoint: PRE_DEPLOY. Decision must bind the exact committed revision produced with this package.

## Defect and fix

T01 on the prior deployment finalized with FINISHED_WITH_ERROR: Authoritative transaction datetime is unavailable. The source incorrectly depended on internal gl.message_raw. The minimal fix uses the official deterministic API gl.vm.get_timestamp() in the shared time helper. The failed write rolled back and all counts remained zero.

## Exact artifacts

- contracts/tracefold.py — SHA-256 $source, 50,573 bytes.
- 	ests/test_tracefold.py — SHA-256 $test.
- 	ests/conftest.py — SHA-256 $harness; test-only GetTimestamp support for Testing Suite 0.30.0rc2 DirectVM.
- vidence/pre-deploy/r12-contract-tests.txt — 29 PASS.
- vidence/pre-deploy/r12-contract-lint.txt — lint and validation PASS, 3 checks, 20 methods.
- vidence/pre-deploy/r12-live-schema.json — live Studio Dev schema PASS.
- vidence/studio/T01-failed-message-raw-time.json — exact finalized rollback and root cause.
- docs/preflight/R12-CORRECTION-PLAN.md — blast radius and replacement plan.

Review requirements: verify the official timestamp API, deterministic semantics, fail-closed behavior, unchanged ABI/storage/trust boundary, tests and schema. Return findings first, then exactly PRE_DEPLOY APPROVED or PRE_DEPLOY REJECTED. Approval applies only to this exact revision/source package. No deployment or write is authorized from a different source hash.
