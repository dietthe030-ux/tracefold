# Tracefold Studio deployment

- Network: `studio-dev`, chain `61997`, RPC `https://studio-dev.genlayer.com/api`
- Operation ID: `tracefold-deploy-df837d5`
- Transaction: `0xbb7263511678e3858b4df4f2363c096813e9dfc6b6cc6aa15b76f6bbdb9b7913`
- Contract: `0xD99Bf40623A7554256F18168C64B482777f10237`
- Exact source revision: `df837d56c3cbb0db76d0e08ad57d582659dbe51b`
- Receipt: `FINALIZED`; lifecycle `finalized / accepted`; consensus `MAJORITY_AGREE`
- Source parity: local and on-chain source are byte-identical, 49,954 bytes, SHA-256 `DE542180BA58FE382F9E55CBD8C7776C989B80766FC87F4882F3CB27FF71552D`
- Constructor readback: `get_upgrader` equals the new deployment actor `0x9ec6a971ff91c7540cce6432e7abf7ece005d5a5`
- Initial state readback: proposal, cluster, and consumption counts are all zero; every configured bound matches the approved source.
- Submitted fee: `100000000000010352` wei; settled spend: `79021500000823` wei; refund: `99920978500009529` wei.

The operation was broadcast once. The wrapper journal's conservative initial `RECONCILIATION_REQUIRED` marker was reconciled through the finalized receipt, deployed-code RPC readback, and authoritative contract calls recorded in `deployment.json`.
