# Tracefold R13 deployment and recovery manifest

- Network: `studio-dev` / `studioDevnet`
- Chain ID: `61997`
- RPC: `https://studio-dev.genlayer.com/api`
- Explorer: `https://explorer-studio-dev.genlayer.com/address/0x8A9c3Ae6521a1d452253F640a615937c6cf9d00D`
- Contract: `0x8A9c3Ae6521a1d452253F640a615937c6cf9d00D`
- Deployment operation: `tf5-deploy-85f6bdc`
- Deployment transaction: `0x30bbbef5527625cc49d0ca622328cf426c5136bbabd72c2fec076ee537cf7ec4`
- Deployment result: `FINALIZED`, `FINISHED_WITH_RETURN`, `MAJORITY_AGREE`
- Exact source commit: `dd96d6eea0faaf36ea8e1c269d5bc57aeeeed863`
- Source: `contracts/tracefold.py`, 50,472 bytes
- Source SHA-256: `85F6BDC602EBF5F8660D915233729ECE3B1CBE8E40EE4DA7BFA1BCE3325DC3B1`
- Source parity: byte-identical through `gen_getContractCode`
- Constructor argument: `upgrader_address=0x9ec6a971ff91c7540cce6432e7abf7ece005d5a5`
- Lifecycle: `UPGRADABLE`
- Deployer/upgrader: `actor19`, `0x9ec6a971ff91c7540cce6432e7abf7ece005d5a5`
- Linked contracts: none
- Configuration transactions: none

If local Studio UI state is lost while chain state and actor19 remain accessible, reconnect to this address, reconcile any fixed operation ID/hash, verify source parity and read state before an approved upgrade. If actor19 becomes unavailable, upgrade authority is lost; preserve the old contract as readable evidence and deploy a replacement from the recorded source after a new gate. If Studio Dev chain state resets, redeploy from the exact source commit, rerun the live matrix, and update release configuration and documentation to the new address.
