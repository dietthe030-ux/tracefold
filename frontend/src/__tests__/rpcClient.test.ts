import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GenLayerRpcClient } from '../services/rpcClient';
import { STUDIO_DEVNET_RPC_URL } from '../types';

describe('GenLayerRpcClient Service & Invariants', () => {
  let client: GenLayerRpcClient;
  const mockContractAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    client = new GenLayerRpcClient({
      rpcUrl: STUDIO_DEVNET_RPC_URL,
      contractAddress: mockContractAddress,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fails closed when contract address is not configured', async () => {
    const unconfiguredClient = new GenLayerRpcClient({
      rpcUrl: STUDIO_DEVNET_RPC_URL,
      contractAddress: '',
    });

    await expect(unconfiguredClient.getCounts()).rejects.toThrow('not configured');
    await expect(unconfiguredClient.getProposals()).rejects.toThrow('not configured');
    await expect(unconfiguredClient.getClusters()).rejects.toThrow('not configured');
  });

  it('fetches counts and caches result within CACHE_TTL window', async () => {
    const mockCounts = {
      proposal_count: 5,
      cluster_count: 3,
      consumption_count: 2,
      max_proposals: 256,
      max_clusters: 128,
      max_aliases_per_cluster: 10,
      max_objections_per_proposal: 8,
    max_assessments_per_proposal: 3,
      max_consumptions: 512,
    };

    const readContractSpy = vi
      .spyOn((client as any).client, 'readContract')
      .mockResolvedValue(JSON.stringify(mockCounts));

    // First call hits readContract
    const res1 = await client.getCounts();
    expect(res1.proposal_count).toBe(5);
    expect(readContractSpy).toHaveBeenCalledTimes(1);

    // Second call hits cache
    const res2 = await client.getCounts();
    expect(res2.proposal_count).toBe(5);
    expect(readContractSpy).toHaveBeenCalledTimes(1);

    // After cache invalidation, hits readContract again
    client.invalidateCache();
    const res3 = await client.getCounts();
    expect(res3.proposal_count).toBe(5);
    expect(readContractSpy).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent in-flight requests for identical endpoints', async () => {
    const mockClusters = {
      items: [
        {
          cluster_id: 1,
          canonical_display_id: 'CVE-2024-3094',
          aliases: ['CVE-2024-3094', 'GHSA-42xw-2xvc-cx4x'],
          packages: ['xz-utils'],
          provenance_citations: ['NVD', 'GHSA'],
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
    };

    const readContractSpy = vi
      .spyOn((client as any).client, 'readContract')
      .mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 20));
        return JSON.stringify(mockClusters);
      });

    // Launch two concurrent requests
    const [c1, c2] = await Promise.all([client.getClusters(0, 20), client.getClusters(0, 20)]);

    expect(c1.length).toBe(1);
    expect(c2.length).toBe(1);
    expect(readContractSpy).toHaveBeenCalledTimes(1);
  });

  it('bounds pagination limit to maximum 20 items', async () => {
    const readContractSpy = vi
      .spyOn((client as any).client, 'readContract')
      .mockResolvedValue(JSON.stringify({ items: [] }));

    await client.getProposals(0, 50); // Requested 50
    expect(readContractSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'get_paged_proposals',
        args: [0, 20], // Clamped to 20
      })
    );
  });

  it('uses the exact ABI for proposal and bounded assessment-history views', async () => {
    const readContractSpy = vi.spyOn((client as any).client, 'readContract')
      .mockResolvedValueOnce(JSON.stringify({ proposal_id: 1 }))
      .mockResolvedValueOnce(JSON.stringify({ items: [] }));
    await client.getProposal(1);
    await client.getAssessmentHistory(1);
    expect(readContractSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ functionName: 'get_proposal', args: [1] }));
    expect(readContractSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ functionName: 'get_assessment_history', args: [1, 0, 3] }));
  });

  it('uses the bounded authoritative consumption-history ABI', async () => {
    const readContractSpy = vi.spyOn((client as any).client, 'readContract')
      .mockResolvedValue(JSON.stringify({ items: [{ index: 1, caller: '0x1111111111111111111111111111111111111111', context_hash: 'ctx', cluster_id: 1, consumed_at: 'now' }] }));
    const rows = await client.getConsumptions(0, 99);
    expect(rows).toHaveLength(1);
    expect(readContractSpy).toHaveBeenCalledWith(expect.objectContaining({ functionName: 'get_paged_consumptions', args: [0, 20] }));
  });

  it('rejects an objection readback that only observes an older record', async () => {
    const hash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    vi.spyOn((client as any).client, 'waitForFinalization').mockResolvedValue({ statusName: 'FINALIZED', txExecutionResultName: 'FINISHED_WITH_RETURN' });
    vi.spyOn(client, 'getObjections').mockResolvedValue([{ proposal_id: 1, index: 0, objector: '0x1111111111111111111111111111111111111111', reason_code: 'OTHER', note: 'old', created_at: 'now' }]);
    await expect(client.waitForFinalityAndReadback(hash, {
      method: 'record_objection', args: [1, 'DIFFERENT_ROOT_CAUSE', 'new evidence'], caller: '0x1111111111111111111111111111111111111111', before: { objectionCount: 1 },
    })).rejects.toThrow('Authoritative readback did not verify');
  });

  it('rejects an unchanged UNRESOLVED retry readback', async () => {
    const hash = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const assessment = { outcome: 'UNRESOLVED', fingerprint: 'same', history_index: 0 } as any;
    vi.spyOn((client as any).client, 'waitForFinalization').mockResolvedValue({ statusName: 'FINALIZED', txExecutionResultName: 'FINISHED_WITH_RETURN' });
    vi.spyOn(client, 'getProposal').mockResolvedValue({ proposal_id: 1, status: 'UNRESOLVED', attempts: 1, last_assessed_at: 'old', latest_assessment: assessment } as any);
    vi.spyOn(client, 'getAssessmentHistory').mockResolvedValue([assessment]);
    await expect(client.waitForFinalityAndReadback(hash, {
      method: 'retry_unresolved', args: [1], caller: '0x1111111111111111111111111111111111111111', before: { attempts: 1, historyTotal: 1, lastAssessedAt: 'old', fingerprint: 'same' },
    })).rejects.toThrow('Authoritative readback did not verify');
  });

  it('accepts exactly one new objection matching the signed intent', async () => {
    const hash = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
    const caller = '0x1111111111111111111111111111111111111111';
    vi.spyOn((client as any).client, 'waitForFinalization').mockResolvedValue({ statusName: 'FINALIZED', txExecutionResultName: 'FINISHED_WITH_RETURN' });
    vi.spyOn(client, 'getObjections').mockResolvedValue([
      { proposal_id: 1, index: 0, objector: caller, reason_code: 'OTHER', note: 'old', created_at: 'before' },
      { proposal_id: 1, index: 1, objector: caller, reason_code: 'DIFFERENT_ROOT_CAUSE', note: 'new evidence', created_at: 'after' },
    ]);
    const result = await client.waitForFinalityAndReadback(hash, {
      method: 'record_objection', args: [1, 'DIFFERENT_ROOT_CAUSE', '  new   evidence  '], caller, before: { objectionCount: 1 },
    });
    expect(result.status).toBe('SUCCESS');
  });

  it('accepts one new assessment history record even when UNRESOLVED repeats', async () => {
    const hash = '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
    const oldAssessment = { outcome: 'UNRESOLVED', fingerprint: 'same', history_index: 0 } as any;
    const newAssessment = { outcome: 'UNRESOLVED', fingerprint: 'same', history_index: 1 } as any;
    vi.spyOn((client as any).client, 'waitForFinalization').mockResolvedValue({ statusName: 'FINALIZED', txExecutionResultName: 'FINISHED_WITH_RETURN' });
    vi.spyOn(client, 'getProposal').mockResolvedValue({ proposal_id: 1, status: 'UNRESOLVED', attempts: 2, last_assessed_at: 'new', latest_assessment: newAssessment } as any);
    vi.spyOn(client, 'getAssessmentHistory').mockResolvedValue([oldAssessment, newAssessment]);
    const result = await client.waitForFinalityAndReadback(hash, {
      method: 'retry_unresolved', args: [1], caller: '0x1111111111111111111111111111111111111111', before: { attempts: 1, historyTotal: 1, lastAssessedAt: 'old', fingerprint: 'same' },
    });
    expect(result.status).toBe('SUCCESS');
  });

  it('fails closed when a receipt omits explicit finality status', async () => {
    const hash = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    vi.spyOn((client as any).client, 'waitForFinalization').mockResolvedValue({ txExecutionResultName: 'FINISHED_WITH_RETURN' });
    await expect(client.waitForFinalityAndReadback(hash, {
      method: 'propose_alias_set', args: ['nonce', 'CVE-2026-1001', '', ''], caller: '0x1111111111111111111111111111111111111111',
    })).rejects.toThrow('did not reach FINALIZED: UNKNOWN');
  });

  it('handles 429 rate limits with jittered cooldown backoff', async () => {
    let attempts = 0;
    vi.spyOn((client as any).client, 'readContract').mockImplementation(async () => {
      attempts++;
      if (attempts === 1) {
        const err = new Error('HTTP 429 Too Many Requests') as Error & { status: number };
        err.status = 429;
        throw err;
      }
      return JSON.stringify({ proposal_id: 1, status: 'PROPOSED' });
    });

    // First attempt fails with 429
    await expect(client.getProposal(1)).rejects.toThrow('429');

    // Cooldown is set
    expect((client as any).rateLimitCooldownUntil).toBeGreaterThan(Date.now());
  });

  it('waitForFinalityAndReadback polls transaction to FINALIZED and verifies state', async () => {
    const mockTxHash = '0x1111222233334444555566667777888899990000111122223333444455556666';
    const mockProposal = {
      proposal_id: 1,
      client_nonce: 'nonce-1',
      canonical_ids: ['CVE-2024-3094', 'GHSA-42xw-2xvc-cx4x'],
      proposer: '0x1111',
      status: 'PROPOSED',
      attempts: 0,
      objection_count: 0,
      created_at: '2026-01-01T00:00:00Z',
    };

    vi.spyOn((client as any).client, 'waitForFinalization').mockResolvedValue({
      statusName: 'FINALIZED',
      txExecutionResultName: 'FINISHED_WITH_RETURN',
    });

    vi.spyOn(client, 'getProposalByNonce').mockResolvedValue(1);
    vi.spyOn(client, 'getProposal').mockResolvedValue(mockProposal as any);

    const receipt = await client.waitForFinalityAndReadback(mockTxHash, {
      method: 'propose_alias_set',
      args: ['nonce-1', 'CVE-2024-3094', 'GHSA-42xw-2xvc-cx4x', ''],
      caller: '0x1111',
    });

    expect(receipt.hash).toBe(mockTxHash);
    expect(receipt.status).toBe('SUCCESS');
    expect(receipt.readbackVerified).toBe(true);
  });

  it('accepts Studio Dev receipts whose explicit execution result is omitted when the leader succeeded', async () => {
    const mockTxHash = '0x2222333344445555666677778888999900001111222233334444555566667777';
    vi.spyOn((client as any).client, 'waitForFinalization').mockResolvedValue({
      statusName: 'FINALIZED',
      consensus_data: {
        leader_receipt: [{ execution_result: 'SUCCESS' }],
        validators: [
          { vote: 'agree', genvm_result: { execution_result: 'SUCCESS' } },
          { vote: 'idle', genvm_result: { execution_result: 'ERROR' } },
        ],
      },
    });

    vi.spyOn(client, 'getProposalByNonce').mockResolvedValue(1);
    vi.spyOn(client, 'getProposal').mockResolvedValue({
      proposal_id: 1,
      client_nonce: 'nonce-2',
      canonical_ids: ['CVE-2024-3094', 'GHSA-42xw-2xvc-cx4x'],
      proposer: '0x1111',
      status: 'PROPOSED',
    } as any);

    const receipt = await client.waitForFinalityAndReadback(mockTxHash, {
      method: 'propose_alias_set',
      args: ['nonce-2', 'CVE-2024-3094', 'GHSA-42xw-2xvc-cx4x', ''],
      caller: '0x1111',
    });

    expect(receipt.status).toBe('SUCCESS');
    expect(receipt.readbackVerified).toBe(true);
  });
});

