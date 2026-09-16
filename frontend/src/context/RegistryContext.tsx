import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import {
  ClusterRecord,
  ConsumptionRecord,
  ObjectionRecord,
  PendingOperation,
  ProposalRecord,
  RegistryCounts,
  ToastMessage,
  TransactionStatus,
} from '../types';
import { rpcClient } from '../services/rpcClient';
import { probeStorageCapability } from '../services/storageProbe';
import { PendingTxStore } from '../services/pendingTxStore';
import { useWallet } from './WalletContext';

interface RegistryContextType {
  clusters: ClusterRecord[];
  proposals: ProposalRecord[];
  counts: RegistryCounts;
  consumptions: ConsumptionRecord[];
  upgraderAddress: string;
  isLoading: boolean;
  activeTx: TransactionStatus | null;
  dismissActiveTx: () => void;
  toasts: ToastMessage[];
  refreshAll: () => Promise<void>;
  proposeAliasSet: (nonce: string, id1: string, id2: string, id3?: string) => Promise<ProposalRecord | null>;
  assessProposal: (proposalId: number) => Promise<string>;
  fileObjection: (proposalId: number, code: string, note: string) => Promise<ObjectionRecord[] | null>;
  retryUnresolved: (proposalId: number) => Promise<string>;
  consumeIncident: (contextHash: string, clusterOrAliasId: string) => Promise<boolean>;
  getObjectionsForProposal: (proposalId: number) => Promise<ObjectionRecord[]>;
  searchAlias: (alias: string) => Promise<ClusterRecord | null>;
  dismissToast: (id: string) => void;
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
}

const RegistryContext = createContext<RegistryContextType | undefined>(undefined);

export const RegistryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { account, writeProvider, phase: walletPhase } = useWallet();
  const [clusters, setClusters] = useState<ClusterRecord[]>([]);
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [consumptions, setConsumptions] = useState<ConsumptionRecord[]>([]);
  const [counts, setCounts] = useState<RegistryCounts>({
    proposal_count: 0,
    cluster_count: 0,
    consumption_count: 0,
    max_proposals: 256,
    max_clusters: 128,
    max_aliases_per_cluster: 10,
    max_objections_per_proposal: 8,
    max_assessments_per_proposal: 3,
    max_consumptions: 512,
  });
  const [upgraderAddress, setUpgraderAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTx, setActiveTx] = useState<TransactionStatus | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isReconcilingRef = useRef(false);
  const activeOperationRef = useRef(false);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, type, title, message, timestamp: Date.now() };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 7000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissActiveTx = useCallback(() => {
    setActiveTx((current) => current && ['SUCCESS', 'REJECTED', 'FAILED'].includes(current.state) ? null : current);
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const cnts = await rpcClient.getCounts();
      const [pList, cList, consumptionList, upg] = await Promise.all([
        rpcClient.getProposals(0, 20),
        rpcClient.getClusters(0, 20),
        rpcClient.getConsumptions(Math.max(0, cnts.consumption_count - 20), 20),
        rpcClient.getUpgrader(),
      ]);

      setCounts(cnts);
      setProposals(pList);
      setClusters(cList);
      setConsumptions(consumptionList);
      setUpgraderAddress(upg);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading registry state';
      // Only display toast if not an unconfigured initial state
      if (!msg.includes('not configured')) {
        addToast('error', 'Sync Failed', msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // Initial load and Pending Operations Reconciliation across reloads
  useEffect(() => {
    refreshAll();

    // Reconcile pending operations if any
    const reconcilePending = async () => {
      if (isReconcilingRef.current) return;
      isReconcilingRef.current = true;

      const pendingOps = PendingTxStore.getPending();
      for (const op of pendingOps) {
        if (!op.hash) {
          PendingTxStore.updateStatus(op.id, 'FAILED', 'Wallet signing ended before a transaction hash was returned.');
          continue;
        }
        if (op.hash) {
          try {
            setActiveTx({
              state: 'RECONCILIATION_REQUIRED',
              hash: op.hash,
              method: op.intent.method,
              description: `Reconciling transaction ${op.hash.slice(0, 10)}...`,
              timestamp: op.submittedAt || Date.now(),
            });

            const res = await rpcClient.waitForFinalityAndReadback(op.hash, op.intent);
            if (res.status === 'SUCCESS') {
              PendingTxStore.updateStatus(op.id, 'CONFIRMED');
              setActiveTx({
                state: 'SUCCESS',
                hash: op.hash,
                method: op.intent.method,
                description: 'Transaction confirmed upon reconciliation.',
              });
              addToast('success', 'Reconciled', `Pending transaction ${op.hash.slice(0, 8)} finalized successfully.`);
            }
          } catch (recErr: unknown) {
            const msg = recErr instanceof Error ? recErr.message : 'Reconciliation failed';
            const terminal = /execution failed/i.test(msg);
            PendingTxStore.updateStatus(op.id, terminal ? 'FAILED' : 'RECONCILING', msg);
            setActiveTx({ state: terminal ? 'FAILED' : 'RECONCILIATION_REQUIRED', hash: op.hash, method: op.intent.method, description: terminal ? undefined : 'This exact transaction is still saved for a later status check.', error: msg });
          }
        }
      }
      await refreshAll();
      isReconcilingRef.current = false;
    };

    reconcilePending();
  }, [refreshAll, addToast]);

  const ensurePreconditions = (actionName: string) => {
    if (activeOperationRef.current) throw new Error('Another Tracefold transaction is already in progress.');
    // 1. Storage capability probe
    const probe = probeStorageCapability();
    if (!probe.ok) {
      throw new Error(`Cannot execute ${actionName}: ${probe.error}`);
    }

    // 2. Wallet connection check
    if (walletPhase !== 'CONNECTED' || !account || !writeProvider) {
      throw new Error(`A connected wallet on the supported network is required to execute ${actionName}.`);
    }
  };

  const beginOperation = (actionName: string) => {
    ensurePreconditions(actionName);
    activeOperationRef.current = true;
  };

  const recordWriteFailure = (opId: string, method: string, message: string, cause: unknown) => {
    const operation = PendingTxStore.getAll().find((item) => item.id === opId);
    const rejection = (cause as { code?: unknown; cause?: { code?: unknown } } | null)?.code === 4001 || (cause as { cause?: { code?: unknown } } | null)?.cause?.code === 4001;
    if (rejection) {
      PendingTxStore.updateStatus(opId, 'FAILED', 'Wallet request rejected');
      setActiveTx({ state: 'REJECTED', method, description: 'You declined the wallet request. No transaction hash was returned.' });
      return;
    }
    const terminal = /execution failed/i.test(message);
    if (operation?.hash && !terminal) {
      PendingTxStore.updateStatus(opId, 'RECONCILING', message);
      setActiveTx({ state: 'RECONCILIATION_REQUIRED', hash: operation.hash, method, description: 'The result is still uncertain. Tracefold will reconcile this exact transaction without resubmitting it.', error: message });
      addToast('warning', 'Reconciliation required', 'The submitted transaction remains saved and will be checked again.');
      return;
    }
    PendingTxStore.updateStatus(opId, 'FAILED', message);
    setActiveTx({
      state: 'FAILED',
      hash: operation?.hash,
      method,
      description: operation?.hash
        ? undefined
        : 'Validation or fee simulation rejected this request before broadcast. No transaction hash was returned.',
      error: message,
    });
  };

  const proposeAliasSet = async (
    nonce: string,
    id1: string,
    id2: string,
    id3 = ''
  ): Promise<ProposalRecord | null> => {
    beginOperation('proposeAliasSet');

    const opId = `op_propose_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const intent: PendingOperation['intent'] = {
      method: 'propose_alias_set',
      args: [nonce, id1, id2, id3],
      caller: account!,
      timestamp: Date.now(),
      description: `Propose aliases: ${[id1, id2, id3].filter(Boolean).join(', ')}`,
    };

    PendingTxStore.saveIntent({
      id: opId,
      intent,
      status: 'SIGNING',
    });

    setActiveTx({
      state: 'WAITING_FOR_WALLET',
      method: 'propose_alias_set',
      description: intent.description,
      timestamp: Date.now(),
    });

    try {
      const txHash = await rpcClient.proposeAliasSet(
        nonce,
        id1,
        id2,
        id3,
        writeProvider!
      );

      PendingTxStore.updateHash(opId, txHash);
      setActiveTx({
        state: 'SUBMITTED',
        hash: txHash,
        method: 'propose_alias_set',
        description: `Waiting for GenLayer finality on transaction ${txHash.slice(0, 10)}...`,
        timestamp: Date.now(),
      });

      const receipt = await rpcClient.waitForFinalityAndReadback(txHash, intent, (statusName) => {
        setActiveTx((prev) => (prev ? { ...prev, state: statusName as TransactionStatus['state'], description: statusName === 'VERIFYING_READBACK' ? 'Finalized; verifying the authoritative contract state…' : `Consensus status: ${statusName}…` } : null));
      });

      if (receipt.status === 'SUCCESS') {
        PendingTxStore.updateStatus(opId, 'CONFIRMED');
        setActiveTx({
          state: 'SUCCESS',
          hash: txHash,
          method: 'propose_alias_set',
          description: 'Proposal created and verified in registry.',
        });
        addToast('success', 'Proposal Submitted', 'Proposal successfully registered and verified.');
        await refreshAll();
        activeOperationRef.current = false;
        return receipt.readbackData as ProposalRecord;
      } else {
        throw new Error('Transaction execution failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Proposal creation failed';
      recordWriteFailure(opId, 'propose_alias_set', msg, err);
      addToast('error', 'Proposal Error', msg);
      activeOperationRef.current = false;
      throw err;
    }
  };

  const recordObjection = async (
    proposalId: number,
    code: string,
    note: string
  ): Promise<ObjectionRecord[] | null> => {
    beginOperation('recordObjection');
    let beforeProposal: ProposalRecord | null;
    try { beforeProposal = await rpcClient.getProposal(proposalId); }
    catch (error) { activeOperationRef.current = false; throw error; }
    if (!beforeProposal) { activeOperationRef.current = false; throw new Error('Proposal state is unavailable before objection signing.'); }

    const opId = `op_obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const intent: PendingOperation['intent'] = {
      method: 'record_objection',
      args: [proposalId, code, note],
      caller: account!,
      timestamp: Date.now(),
      description: `File objection [${code}] on Proposal #${proposalId}`,
      before: { objectionCount: beforeProposal.objection_count },
    };

    PendingTxStore.saveIntent({
      id: opId,
      intent,
      status: 'SIGNING',
    });

    setActiveTx({
      state: 'WAITING_FOR_WALLET',
      method: 'record_objection',
      description: intent.description,
      timestamp: Date.now(),
    });

    try {
      const txHash = await rpcClient.recordObjection(
        proposalId,
        code,
        note,
        writeProvider!
      );

      PendingTxStore.updateHash(opId, txHash);
      setActiveTx({
        state: 'SUBMITTED',
        hash: txHash,
        method: 'record_objection',
        description: `Waiting for finality on objection transaction ${txHash.slice(0, 10)}...`,
        timestamp: Date.now(),
      });

      const receipt = await rpcClient.waitForFinalityAndReadback(txHash, intent, (statusName) => {
        setActiveTx((prev) => (prev ? { ...prev, state: statusName as TransactionStatus['state'], description: statusName === 'VERIFYING_READBACK' ? 'Finalized; verifying the authoritative contract state…' : `Consensus status: ${statusName}…` } : null));
      });

      if (receipt.status === 'SUCCESS') {
        PendingTxStore.updateStatus(opId, 'CONFIRMED');
        setActiveTx({
          state: 'SUCCESS',
          hash: txHash,
          method: 'record_objection',
          description: `Objection recorded on Proposal #${proposalId}.`,
        });
        addToast('success', 'Objection Filed', `Formal objection recorded on proposal #${proposalId}.`);
        await refreshAll();
        activeOperationRef.current = false;
        return receipt.readbackData as ObjectionRecord[];
      } else {
        throw new Error('Transaction execution failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to file objection';
      recordWriteFailure(opId, 'record_objection', msg, err);
      addToast('error', 'Objection Error', msg);
      activeOperationRef.current = false;
      throw err;
    }
  };

  const assessProposal = async (proposalId: number): Promise<string> => {
    beginOperation('assessProposal');
    let beforeProposal: ProposalRecord | null;
    let beforeHistory;
    try { [beforeProposal, beforeHistory] = await Promise.all([rpcClient.getProposal(proposalId), rpcClient.getAssessmentHistory(proposalId)]); }
    catch (error) { activeOperationRef.current = false; throw error; }
    if (!beforeProposal) { activeOperationRef.current = false; throw new Error('Proposal state is unavailable before assessment signing.'); }

    const opId = `op_assess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const intent: PendingOperation['intent'] = {
      method: 'assess_proposal',
      args: [proposalId],
      caller: account!,
      timestamp: Date.now(),
      description: `Consensus adjudication for Proposal #${proposalId}`,
      before: { attempts: beforeProposal.attempts, historyTotal: beforeHistory.length, lastAssessedAt: beforeProposal.last_assessed_at, fingerprint: beforeProposal.latest_assessment?.fingerprint },
    };

    PendingTxStore.saveIntent({
      id: opId,
      intent,
      status: 'SIGNING',
    });

    setActiveTx({
      state: 'WAITING_FOR_WALLET',
      method: 'assess_proposal',
      description: intent.description,
      timestamp: Date.now(),
    });

    try {
      const txHash = await rpcClient.assessProposal(proposalId, writeProvider!);

      PendingTxStore.updateHash(opId, txHash);
      setActiveTx({
        state: 'SUBMITTED',
        hash: txHash,
        method: 'assess_proposal',
        description: `GenLayer validators are verifying public evidence and reaching consensus…`,
        timestamp: Date.now(),
      });

      const receipt = await rpcClient.waitForFinalityAndReadback(txHash, intent, (statusName) => {
        setActiveTx((prev) => (prev ? { ...prev, state: statusName as TransactionStatus['state'], description: statusName === 'VERIFYING_READBACK' ? 'Finalized; verifying the authoritative contract state…' : `Consensus status: ${statusName}…` } : null));
      });

      if (receipt.status === 'SUCCESS') {
        PendingTxStore.updateStatus(opId, 'CONFIRMED');
        const updatedProp = receipt.readbackData as ProposalRecord | null;
        const outcome = updatedProp?.latest_assessment?.outcome || 'ASSESSED';

        setActiveTx({
          state: 'SUCCESS',
          hash: txHash,
          method: 'assess_proposal',
          description: `Consensus Finalized: ${outcome}`,
        });
        addToast('success', 'Assessment Complete', `Consensus completed with outcome: ${outcome}`);
        await refreshAll();
        activeOperationRef.current = false;
        return outcome;
      } else {
        throw new Error('Assessment transaction execution failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Assessment failed';
      recordWriteFailure(opId, 'assess_proposal', msg, err);
      addToast('error', 'Assessment Error', msg);
      activeOperationRef.current = false;
      throw err;
    }
  };

  const retryUnresolved = async (proposalId: number): Promise<string> => {
    beginOperation('retryUnresolved');
    let beforeProposal: ProposalRecord | null;
    let beforeHistory;
    try { [beforeProposal, beforeHistory] = await Promise.all([rpcClient.getProposal(proposalId), rpcClient.getAssessmentHistory(proposalId)]); }
    catch (error) { activeOperationRef.current = false; throw error; }
    if (!beforeProposal) { activeOperationRef.current = false; throw new Error('Proposal state is unavailable before retry signing.'); }

    const opId = `op_retry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const intent: PendingOperation['intent'] = {
      method: 'retry_unresolved',
      args: [proposalId],
      caller: account!,
      timestamp: Date.now(),
      description: `Retry assessment on UNRESOLVED Proposal #${proposalId}`,
      before: { attempts: beforeProposal.attempts, historyTotal: beforeHistory.length, lastAssessedAt: beforeProposal.last_assessed_at, fingerprint: beforeProposal.latest_assessment?.fingerprint },
    };

    PendingTxStore.saveIntent({
      id: opId,
      intent,
      status: 'SIGNING',
    });

    setActiveTx({
      state: 'WAITING_FOR_WALLET',
      method: 'retry_unresolved',
      description: intent.description,
      timestamp: Date.now(),
    });

    try {
      const txHash = await rpcClient.retryUnresolved(proposalId, writeProvider!);

      PendingTxStore.updateHash(opId, txHash);
      setActiveTx({
        state: 'SUBMITTED',
        hash: txHash,
        method: 'retry_unresolved',
        description: `GenLayer validators are retrying the evidence assessment…`,
        timestamp: Date.now(),
      });

      const receipt = await rpcClient.waitForFinalityAndReadback(txHash, intent, (statusName) => {
        setActiveTx((prev) => (prev ? { ...prev, state: statusName as TransactionStatus['state'], description: statusName === 'VERIFYING_READBACK' ? 'Finalized; verifying the authoritative contract state…' : `Consensus status: ${statusName}…` } : null));
      });

      if (receipt.status === 'SUCCESS') {
        PendingTxStore.updateStatus(opId, 'CONFIRMED');
        const updatedProp = receipt.readbackData as ProposalRecord | null;
        const outcome = updatedProp?.latest_assessment?.outcome || 'ASSESSED';

        setActiveTx({
          state: 'SUCCESS',
          hash: txHash,
          method: 'retry_unresolved',
          description: `Retry Finalized: ${outcome}`,
        });
        addToast('success', 'Retry Succeeded', `Assessment retry completed: ${outcome}`);
        await refreshAll();
        activeOperationRef.current = false;
        return outcome;
      } else {
        throw new Error('Retry transaction execution failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Retry failed';
      recordWriteFailure(opId, 'retry_unresolved', msg, err);
      addToast('error', 'Retry Error', msg);
      activeOperationRef.current = false;
      throw err;
    }
  };

  const consumeIncident = async (
    contextHash: string,
    clusterOrAliasId: string
  ): Promise<boolean> => {
    beginOperation('consumeIncident');
    let beforeCounts: RegistryCounts;
    try { beforeCounts = await rpcClient.getCounts(); }
    catch (error) { activeOperationRef.current = false; throw error; }

    const opId = `op_consume_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const intent: PendingOperation['intent'] = {
      method: 'consume_incident',
      args: [contextHash, clusterOrAliasId],
      caller: account!,
      timestamp: Date.now(),
      description: `Exact-once consumption for context ${contextHash} on ${clusterOrAliasId}`,
      before: { consumptionCount: beforeCounts.consumption_count },
    };

    PendingTxStore.saveIntent({
      id: opId,
      intent,
      status: 'SIGNING',
    });

    setActiveTx({
      state: 'WAITING_FOR_WALLET',
      method: 'consume_incident',
      description: intent.description,
      timestamp: Date.now(),
    });

    try {
      const txHash = await rpcClient.consumeIncident(
        contextHash,
        clusterOrAliasId,
        writeProvider!
      );

      PendingTxStore.updateHash(opId, txHash);
      setActiveTx({
        state: 'SUBMITTED',
        hash: txHash,
        method: 'consume_incident',
        description: `Submitting exact-once consumption transaction ${txHash.slice(0, 10)}...`,
        timestamp: Date.now(),
      });

      const receipt = await rpcClient.waitForFinalityAndReadback(txHash, intent, (statusName) => {
        setActiveTx((prev) => (prev ? { ...prev, state: statusName as TransactionStatus['state'], description: statusName === 'VERIFYING_READBACK' ? 'Finalized; verifying the authoritative contract state…' : `Consensus status: ${statusName}…` } : null));
      });

      if (receipt.status === 'SUCCESS') {
        PendingTxStore.updateStatus(opId, 'CONFIRMED');
        setActiveTx({
          state: 'SUCCESS',
          hash: txHash,
          method: 'consume_incident',
          description: `Exact-once consumption registered and verified for ${clusterOrAliasId}.`,
        });
        addToast('success', 'Incident Consumed', `Exact-once consumption confirmed for ${clusterOrAliasId}.`);
        await refreshAll();
        activeOperationRef.current = false;
        return true;
      } else {
        throw new Error('Consumption transaction execution failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Consumption failed';
      recordWriteFailure(opId, 'consume_incident', msg, err);
      addToast('error', 'Consumption Rejected', msg);
      activeOperationRef.current = false;
      throw err;
    }
  };

  const getObjectionsForProposal = async (proposalId: number): Promise<ObjectionRecord[]> => {
    return rpcClient.getObjections(proposalId);
  };

  const searchAlias = async (alias: string): Promise<ClusterRecord | null> => {
    return rpcClient.resolveAlias(alias);
  };

  return (
    <RegistryContext.Provider
      value={{
        clusters,
        proposals,
        counts,
        consumptions,
        upgraderAddress,
        isLoading,
        activeTx,
        dismissActiveTx,
        toasts,
        refreshAll,
        proposeAliasSet,
        assessProposal,
        fileObjection: recordObjection,
        retryUnresolved,
        consumeIncident,
        getObjectionsForProposal,
        searchAlias,
        dismissToast,
        addToast,
      }}
    >
      {children}
    </RegistryContext.Provider>
  );
};

export const useRegistry = (): RegistryContextType => {
  const context = useContext(RegistryContext);
  if (!context) {
    throw new Error('useRegistry must be used within a RegistryProvider');
  }
  return context;
};


