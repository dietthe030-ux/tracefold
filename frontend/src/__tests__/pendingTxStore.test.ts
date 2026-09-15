import { describe, it, expect, beforeEach } from 'vitest';
import { PendingTxStore } from '../services/pendingTxStore';
import { PendingOperation } from '../types';

describe('PendingTxStore (Transaction Intent & Reconciliation Store)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists transaction intent prior to wallet signing', () => {
    const op: PendingOperation = {
      id: 'intent-1234',
      intent: {
        method: 'propose_alias_set',
        args: ['tracefold-nonce-1', 'CVE-2024-3094', 'GHSA-42xw-2xvc-cx4x', ''],
        caller: '0x1111111111111111111111111111111111111111',
        timestamp: Date.now(),
        description: 'Propose alias set CVE-2024-3094 + GHSA-42xw-2xvc-cx4x',
      },
      status: 'SIGNING',
    };

    PendingTxStore.saveIntent(op);
    const retrieved = PendingTxStore.getAll();
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].id).toBe('intent-1234');
    expect(retrieved[0].status).toBe('SIGNING');
    expect(retrieved[0].intent.method).toBe('propose_alias_set');
  });

  it('updates volatile hash and status upon broadcast', () => {
    const op: PendingOperation = {
      id: 'intent-broadcast',
      intent: {
        method: 'record_objection',
        args: [1, 'DIFFERENT_ROOT_CAUSE', 'Separate roots'],
        caller: '0x1111111111111111111111111111111111111111',
        timestamp: Date.now(),
        description: 'Objection on Proposal #1',
      },
      status: 'SIGNING',
    };
    PendingTxStore.saveIntent(op);

    PendingTxStore.updateHash(
      'intent-broadcast',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    );

    const pending = PendingTxStore.getPending();
    expect(pending.length).toBe(1);
    expect(pending[0].status).toBe('PENDING');
    expect(pending[0].hash).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    expect(pending[0].submittedAt).toBeDefined();
  });

  it('updates transaction status to CONFIRMED or FAILED', () => {
    const op: PendingOperation = {
      id: 'tx-status',
      intent: {
        method: 'assess_proposal',
        args: [1],
        caller: '0x1111111111111111111111111111111111111111',
        timestamp: Date.now(),
        description: 'Assess Proposal 1',
      },
      status: 'PENDING',
    };
    PendingTxStore.saveIntent(op);

    PendingTxStore.updateStatus('tx-status', 'CONFIRMED');
    const all = PendingTxStore.getAll();
    expect(all[0].status).toBe('CONFIRMED');

    // Pending should now be empty
    expect(PendingTxStore.getPending().length).toBe(0);
  });

  it('removes specific transaction and clears completed transactions', () => {
    PendingTxStore.saveIntent({
      id: 'tx-1',
      intent: {
        method: 'propose_alias_set',
        args: ['nonce-1', 'CVE-2024-3094', 'GHSA-42xw-2xvc-cx4x', ''],
        caller: '0x1111',
        timestamp: Date.now(),
        description: 'Done 1',
      },
      status: 'CONFIRMED',
    });

    PendingTxStore.saveIntent({
      id: 'tx-2',
      intent: {
        method: 'consume_incident',
        args: ['CTX-1', '1'],
        caller: '0x1111',
        timestamp: Date.now(),
        description: 'Pending 2',
      },
      status: 'PENDING',
    });

    expect(PendingTxStore.getAll().length).toBe(2);

    PendingTxStore.clearCompleted();
    expect(PendingTxStore.getAll().length).toBe(1);
    expect(PendingTxStore.getAll()[0].id).toBe('tx-2');

    PendingTxStore.remove('tx-2');
    expect(PendingTxStore.getAll().length).toBe(0);
  });
});
