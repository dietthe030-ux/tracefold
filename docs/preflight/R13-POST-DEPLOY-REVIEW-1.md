# R13 POST_DEPLOY_TEST anonymous review 1

- Reviewer task: `01a0a536-2f73-7ed1-b962-9f40520d4e77`
- Reviewed carrier: `2c070f028833a32020aa932013488905866c611a`
- Package: `TRACEFOLD-R13-POST-DEPLOY-V2`
- Verdict: `ANONYMOUS REVIEW CHANGES REQUIRED - POST_DEPLOY_TEST`

## F01 — corrected

`evidence/studio/R13-DEPLOYMENT-RECOVERY-MANIFEST.md` incorrectly stated that the deployment had no constructor arguments. The deployed transaction, schema, source, T00 readback and `get_upgrader` bind `upgrader_address` to `0x9ec6a971ff91c7540cce6432e7abf7ece005d5a5`.

Correction revision `ca744d3254027bd79e8d9fe4b54eafd8b53b2b49` records that exact constructor binding.

## F02 — corrected

`evidence/vercel/R13-VERCEL-E2E-PLAN.md` proposed a new nonce with a pair whose existing proposal was already `MERGED`, while expecting the contract to return proposal `1`. The contract only reuses an ID-set proposal in `PROPOSED` or `UNRESOLVED`, so the stated expectation was impossible.

Correction revision `ca744d3254027bd79e8d9fe4b54eafd8b53b2b49` uses a fresh unused pair, expects proposal `7` in `PROPOSED`, binds counts `6 → 7`, and explicitly permits one broadcast only. Recovery reconciles the retained hash without a second submission.

## Corrected package

- Carrier: `d4772908ffa991805ec92af94bb7b5fe732984ed`
- Package ID: `TRACEFOLD-R13-POST-DEPLOY-V3`
- Package SHA-256: `776EEFC254D0750C39DD3741AD77E20CB431B73C376D67EC4E4E1A5C9DB0A705`
