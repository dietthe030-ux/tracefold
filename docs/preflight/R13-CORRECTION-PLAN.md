# R13 Studio clock correction

R12 T01 at `0xc9522C696a482CdCe5A12A684a814eeb575CbE3a` finalized and rolled back with `Authoritative transaction datetime is unavailable`; see `evidence/studio/R12-T01-gettimestamp-fail.json`. The selected Studio Dev host does not implement the SDK `GetTimestamp` call.

Current official GenLayer documentation specifies `datetime.datetime.now(datetime.timezone.utc)` as the deterministic transaction clock shared by validator re-execution. The contract now uses that documented clock in its one shared helper and fails closed if clock access fails. The previous live contract proves this exact clock produces stored timestamps equal to transaction receipt timestamps in real writes; its apparent cooldown anomaly came from the fee simulator's stale synthetic clock, not live transaction execution.

ABI, storage, constructor, actors, state transitions and product scope are unchanged. The Testing Suite's native `warp()` covers the deterministic clock; the temporary GetTimestamp harness shim was removed. The R13 matrix uses a generic official fee estimate for the time-dependent retry and proves the cooldown rejection with one actual rollback, because targeted fee simulation does not reproduce the live transaction clock.
