import { beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  estimate: vi.fn(),
  write: vi.fn(),
  read: vi.fn(),
  wait: vi.fn(),
}));

vi.mock('genlayer-js', () => ({
  chains: { studioDevnet: {} },
  isSuccessful: vi.fn(() => true),
  createClient: vi.fn(() => ({
    estimateTransactionFeesForWrite: sdk.estimate,
    writeContract: sdk.write,
    readContract: sdk.read,
    waitForFinalization: sdk.wait,
  })),
}));

import { GenLayerRpcClient } from '../services/rpcClient';

describe('write fee and provider binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sdk.estimate.mockResolvedValue({ distribution: { leader: 1n }, messageAllocations: [{ amount: 2n }], feeValue: 3n });
    sdk.write.mockResolvedValue(`0x${'a'.repeat(64)}`);
  });

  it('checks balance and passes the exact estimate to the signed write', async () => {
    const account = `0x${'1'.repeat(40)}`;
    const provider = { request: vi.fn(async ({ method }: { method: string }) => method === 'eth_accounts' ? [account] : '0x64') };
    const client = new GenLayerRpcClient({ contractAddress: `0x${'2'.repeat(40)}` });
    await client.assessProposal(7, provider);
    expect(provider.request).toHaveBeenCalledWith({ method: 'eth_getBalance', params: [account, 'latest'] });
    expect(sdk.write).toHaveBeenCalledWith(expect.objectContaining({ functionName: 'assess_proposal', args: [7], fees: { distribution: { leader: 1n }, messageAllocations: [{ amount: 2n }], feeValue: 3n } }));
  });

  it('fails before submission when spendable GEN is below the estimated fee', async () => {
    const account = `0x${'1'.repeat(40)}`;
    const provider = { request: vi.fn(async ({ method }: { method: string }) => method === 'eth_accounts' ? [account] : '0x2') };
    const client = new GenLayerRpcClient({ contractAddress: `0x${'2'.repeat(40)}` });
    await expect(client.assessProposal(7, provider)).rejects.toThrow('enough GEN');
    expect(sdk.write).not.toHaveBeenCalled();
  });
});
