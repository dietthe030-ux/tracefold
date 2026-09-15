import { createClient, chains, isSuccessful } from 'genlayer-js';
import { ExecutionResult, type Hash } from 'genlayer-js/types';
import {
  ClusterRecord,
  ConsumptionRecord,
  EIP1193Provider,
  ObjectionRecord,
  PendingOperation,
  AssessmentRecord,
  ProposalRecord,
  RegistryCounts,
  STUDIO_DEVNET_CHAIN_ID,
  STUDIO_DEVNET_RPC_URL,
} from '../types';

export interface RpcConfig {
  rpcUrl: string;
  contractAddress: string;
}

const DEFAULT_RPC_URL = import.meta.env.VITE_GENLAYER_RPC_URL || STUDIO_DEVNET_RPC_URL;
const DEFAULT_CONTRACT_ADDRESS = import.meta.env.VITE_TRACEFOLD_CONTRACT_ADDRESS || '';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface TransactionReceiptResult {
  hash: string;
  status: 'SUCCESS' | 'FAILED';
  statusName: string;
  executionResult?: unknown;
  readbackVerified: boolean;
  readbackData?: unknown;
}

export class GenLayerRpcClient {
  private config: RpcConfig;
  private client: ReturnType<typeof createClient>;
  private cache = new Map<string, CacheEntry<unknown>>();
  private inFlightRequests = new Map<string, Promise<unknown>>();
  private activePollingLocks = new Set<string>();
  private readonly CACHE_TTL_MS = 10000; // 10s safe cache for reads

  // Global request queue (max 1 batch in-flight)
  private queue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  // 429 Cooldown state
  private rateLimitCooldownUntil = 0;

  constructor(config?: Partial<RpcConfig>) {
    this.config = {
      rpcUrl: config?.rpcUrl || DEFAULT_RPC_URL,
      contractAddress: config?.contractAddress || DEFAULT_CONTRACT_ADDRESS,
    };

    this.client = createClient({
      chain: {
        ...chains.studioDevnet,
        id: STUDIO_DEVNET_CHAIN_ID,
        rpcUrls: {
          default: { http: [this.config.rpcUrl] },
        },
      },
    });
  }

  public setConfig(config: Partial<RpcConfig>) {
    this.config = { ...this.config, ...config };
    this.cache.clear();
    this.client = createClient({
      chain: {
        ...chains.studioDevnet,
        id: STUDIO_DEVNET_CHAIN_ID,
        rpcUrls: {
          default: { http: [this.config.rpcUrl] },
        },
      },
    });
  }

  public getConfig(): RpcConfig {
    return { ...this.config };
  }

  public invalidateCache(): void {
    this.cache.clear();
  }

  private isContractConfigured(): boolean {
    return (
      typeof this.config.contractAddress === 'string' &&
      this.config.contractAddress.trim().length > 0 &&
      this.config.contractAddress !== '0x0000000000000000000000000000000000000000'
    );
  }

  private requireContractConfigured(): void {
    if (!this.isContractConfigured()) {
      throw new Error('Tracefold contract is not configured. Set VITE_TRACEFOLD_CONTRACT_ADDRESS.');
    }
  }

  private async enqueueRequest<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Pause if tab is hidden
          if (typeof document !== 'undefined' && document.hidden) {
            await new Promise<void>((res) => {
              const onVisible = () => {
                if (!document.hidden) {
                  document.removeEventListener('visibilitychange', onVisible);
                  res();
                }
              };
              document.addEventListener('visibilitychange', onVisible);
            });
          }

          // Respect 429 cooldown if active
          const now = Date.now();
          if (this.rateLimitCooldownUntil > now) {
            const waitTime = this.rateLimitCooldownUntil - now;
            await new Promise((r) => setTimeout(r, waitTime));
          }

          const result = await task();
          resolve(result);
        } catch (err: unknown) {
          const errorObj = err as { status?: number; response?: { headers?: Headers }; message?: string };
          if (errorObj?.status === 429 || (errorObj?.message && errorObj.message.includes('429'))) {
            // Apply jittered backoff
            const backoff = 3000 + Math.floor(Math.random() * 2000);
            this.rateLimitCooldownUntil = Date.now() + backoff;
          }
          reject(err);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch {
          // Task errors rejected to caller promise
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();
    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data as T;
    }

    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<T>;
    }

    const promise = (async () => {
      try {
        const data = await this.enqueueRequest(fetcher);
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  // --- Public Read Methods ---

  public async getCounts(): Promise<RegistryCounts> {
    this.requireContractConfigured();

    const cacheKey = `counts:${this.config.contractAddress}`;
    return this.fetchWithCache(cacheKey, async () => {
      const raw = await this.client.readContract({
        address: this.config.contractAddress as `0x${string}`,
        functionName: 'get_counts',
        args: [],
      });
      if (typeof raw === 'string') {
        return JSON.parse(raw) as RegistryCounts;
      }
      if (typeof raw === 'object' && raw !== null) {
        return raw as unknown as RegistryCounts;
      }
      return {
        proposal_count: 0,
        cluster_count: 0,
        consumption_count: 0,
        max_proposals: 256,
        max_clusters: 128,
        max_aliases_per_cluster: 10,
        max_objections_per_proposal: 8,
    max_assessments_per_proposal: 3,
        max_consumptions: 512,
      };
    });
  }

  public async getProposals(offset = 0, limit = 20): Promise<ProposalRecord[]> {
    this.requireContractConfigured();

    const boundedLimit = Math.min(Math.max(limit, 1), 20);
    const cacheKey = `proposals:${this.config.contractAddress}:${offset}:${boundedLimit}`;

    return this.fetchWithCache(cacheKey, async () => {
      const raw = await this.client.readContract({
        address: this.config.contractAddress as `0x${string}`,
        functionName: 'get_paged_proposals',
        args: [offset, boundedLimit],
      });
      if (typeof raw === 'string') {
        const parsed = JSON.parse(raw);
        return (parsed.items || []) as ProposalRecord[];
      }
      if (typeof raw === 'object' && raw !== null) {
        const obj = raw as { items?: ProposalRecord[] };
        return obj.items || [];
      }
      return [];
    });
  }

  public async getProposal(proposalId: number): Promise<ProposalRecord | null> {
    if (!this.isContractConfigured() || proposalId <= 0) return null;

    const cacheKey = `proposal:${this.config.contractAddress}:${proposalId}`;
    return this.fetchWithCache(cacheKey, async () => {
      const raw = await this.client.readContract({
        address: this.config.contractAddress as `0x${string}`,
        functionName: 'get_proposal',
        args: [proposalId],
      });
      if (typeof raw === 'string' && raw.trim().length > 0) {
        return JSON.parse(raw) as ProposalRecord;
      }
      if (typeof raw === 'object' && raw !== null) {
        return raw as unknown as ProposalRecord;
      }
      return null;
    });
  }

  public async getAssessmentHistory(proposalId: number): Promise<AssessmentRecord[]> {
    if (!this.isContractConfigured() || proposalId <= 0) return [];
    const cacheKey = `assessment_history:${this.config.contractAddress}:${proposalId}`;
    return this.fetchWithCache(cacheKey, async () => {
      const raw = await this.client.readContract({
        address: this.config.contractAddress as `0x${string}`,
        functionName: 'get_assessment_history',
        args: [proposalId, 0, 3],
      });
      if (typeof raw === 'string') return (JSON.parse(raw).items || []) as AssessmentRecord[];
      return ((raw as { items?: AssessmentRecord[] } | null)?.items || []);
    });
  }

  public async getClusters(offset = 0, limit = 20): Promise<ClusterRecord[]> {
    this.requireContractConfigured();

    const boundedLimit = Math.min(Math.max(limit, 1), 20);
    const cacheKey = `clusters:${this.config.contractAddress}:${offset}:${boundedLimit}`;

    return this.fetchWithCache(cacheKey, async () => {
      const raw = await this.client.readContract({
        address: this.config.contractAddress as `0x${string}`,
        functionName: 'get_paged_clusters',
        args: [offset, boundedLimit],
      });
      if (typeof raw === 'string') {
        const parsed = JSON.parse(raw);
        return (parsed.items || []) as ClusterRecord[];
      }
      if (typeof raw === 'object' && raw !== null) {
        const obj = raw as { items?: ClusterRecord[] };
        return obj.items || [];
      }
      return [];
    });
  }

  public async getConsumptions(offset = 0, limit = 20): Promise<ConsumptionRecord[]> {
    this.requireContractConfigured();
    const boundedLimit = Math.min(Math.max(limit, 1), 20);
    const cacheKey = `consumptions:${this.config.contractAddress}:${offset}:${boundedLimit}`;
    return this.fetchWithCache(cacheKey, async () => {
      const raw = await this.client.readContract({
        address: this.config.contractAddress as `0x${string}`,
        functionName: 'get_paged_consumptions',
        args: [offset, boundedLimit],
      });
      if (typeof raw === 'string') return (JSON.parse(raw).items || []) as ConsumptionRecord[];
      return ((raw as { items?: ConsumptionRecord[] } | null)?.items || []);
    });
  }

  public async getCluster(clusterId: number): Promise<ClusterRecord | null> {
    if (!this.isContractConfigured() || clusterId <= 0) return null;

    const cacheKey = `cluster:${this.config.contractAddress}:${clusterId}`;
    return this.fetchWithCache(cacheKey, async () => {
      const raw = await this.client.readContract({
        address: this.config.contractAddress as `0x${string}`,
        functionName: 'get_cluster',
        args: [clusterId],
      });
      if (typeof raw === 'string' && raw.trim().length > 0) {
        return JSON.parse(raw) as ClusterRecord;
      }
      if (typeof raw === 'object' && raw !== null) {
        return raw as unknown as ClusterRecord;
      }
      return null;
    });
  }

  public async resolveAlias(aliasId: string): Promise<ClusterRecord | null> {
    if (!this.isContractConfigured() || !aliasId.trim()) return null;

    const norm = aliasId.trim().toUpperCase();
    const cacheKey = `resolve_alias:${this.config.contractAddress}:${norm}`;

    return this.fetchWithCache(cacheKey, async () => {
      const raw = await this.client.readContract({
        address: this.config.contractAddress as `0x${string}`,
        functionName: 'resolve_alias',
        args: [norm],
      });
      if (typeof raw === 'string' && raw.trim().length > 0) {
        return JSON.parse(raw) as ClusterRecord;
      }
      if (typeof raw === 'object' && raw !== null) {
        return raw as unknown as ClusterRecord;
      }
      return null;
    });
  }

  public async getObjections(
    proposalId: number,
    offset = 0,
    limit = 20
  ): Promise<ObjectionRecord[]> {
    if (!this.isContractConfigured() || proposalId <= 0) return [];

    const boundedLimit = Math.min(Math.max(limit, 1), 20);
    const cacheKey = `objections:${this.config.contractAddress}:${proposalId}:${offset}:${boundedLimit}`;

    return this.fetchWithCache(cacheKey, async () => {
      const raw = await this.client.readContract({
        address: this.config.contractAddress as `0x${string}`,
        functionName: 'get_paged_objections',
        args: [proposalId, offset, boundedLimit],
      });
      if (typeof raw === 'string') {
        const parsed = JSON.parse(raw);
        return (parsed.items || []) as ObjectionRecord[];
      }
      if (typeof raw === 'object' && raw !== null) {
        const obj = raw as { items?: ObjectionRecord[] };
        return obj.items || [];
      }
      return [];
    });
  }

  public async isConsumed(
    caller: string,
    contextHash: string,
    clusterOrAliasId: string
  ): Promise<boolean> {
    if (!this.isContractConfigured() || !caller || !contextHash || !clusterOrAliasId) {
      return false;
    }

    const cacheKey = `is_consumed:${this.config.contractAddress}:${caller.toLowerCase()}:${contextHash.trim()}:${clusterOrAliasId.trim()}`;
    return this.fetchWithCache(cacheKey, async () => {
      const raw = await this.client.readContract({
        address: this.config.contractAddress as `0x${string}`,
        functionName: 'is_consumed',
        args: [caller, contextHash.trim(), clusterOrAliasId.trim()],
      });
      return Boolean(raw);
    });
  }

  public async getProposalByNonce(proposer: string, clientNonce: string): Promise<number> {
    if (!this.isContractConfigured() || !proposer || !clientNonce) return 0;

    const cacheKey = `proposal_by_nonce:${this.config.contractAddress}:${proposer.toLowerCase()}:${clientNonce.trim()}`;
    return this.fetchWithCache(cacheKey, async () => {
      const raw = await this.client.readContract({
        address: this.config.contractAddress as `0x${string}`,
        functionName: 'get_proposal_by_nonce',
        args: [proposer, clientNonce.trim()],
      });
      return Number(raw) || 0;
    });
  }

  public async getUpgrader(): Promise<string> {
    this.requireContractConfigured();

    const cacheKey = `upgrader:${this.config.contractAddress}`;
    return this.fetchWithCache(cacheKey, async () => {
      const raw = await this.client.readContract({
        address: this.config.contractAddress as `0x${string}`,
        functionName: 'get_upgrader',
        args: [],
      });
      return typeof raw === 'string' ? raw : String(raw || '');
    });
  }

  // --- Write Methods (Sending Contract Transactions) ---

  private async executeWrite(
    functionName: string,
    args: unknown[],
    providerOrAccount?: EIP1193Provider | { address: string }
  ): Promise<string> {
    if (!this.isContractConfigured()) {
      throw new Error(
        'Tracefold Contract Address is not configured. Please set VITE_TRACEFOLD_CONTRACT_ADDRESS in .env.'
      );
    }

    this.invalidateCache();

    if (!providerOrAccount) {
      throw new Error('Wallet connection required to submit transaction');
    }

    // Browser writes must be signed by the exact provider/account selected by the user.
    if ('request' in providerOrAccount && typeof providerOrAccount.request === 'function') {
      const provider = providerOrAccount as EIP1193Provider;
      const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];
      const account = accounts?.[0];
      if (!account || !/^0x[0-9a-fA-F]{40}$/.test(account)) {
        throw new Error('Selected wallet has no valid active account');
      }
      const clientWithAccount = createClient({
        chain: {
          ...chains.studioDevnet,
          id: STUDIO_DEVNET_CHAIN_ID,
          rpcUrls: { default: { http: [this.config.rpcUrl] } },
        },
        account: account as any,
        provider,
      });
      const estimate = await clientWithAccount.estimateTransactionFeesForWrite({
        address: this.config.contractAddress as `0x${string}`,
        functionName,
        args: args as any,
        value: BigInt(0),
      });
      const balanceHex = await provider.request({ method: 'eth_getBalance', params: [account, 'latest'] }) as string;
      const balance = BigInt(balanceHex);
      if (balance < estimate.feeValue) throw new Error('This wallet does not have enough GEN for the estimated transaction fee.');
      return clientWithAccount.writeContract({
        address: this.config.contractAddress as `0x${string}`,
        functionName,
        args: args as any,
        value: BigInt(0),
        fees: { distribution: estimate.distribution, messageAllocations: estimate.messageAllocations, feeValue: estimate.feeValue },
      });
    }

    // Direct account object
    const clientWithAccount = createClient({
      chain: {
        ...chains.studioDevnet,
        id: STUDIO_DEVNET_CHAIN_ID,
        rpcUrls: { default: { http: [this.config.rpcUrl] } },
      },
      account: providerOrAccount as any,
    });

    const estimate = await clientWithAccount.estimateTransactionFeesForWrite({
      address: this.config.contractAddress as `0x${string}`,
      functionName,
      args: args as any,
      value: BigInt(0),
    });
    const txHash = await clientWithAccount.writeContract({
      address: this.config.contractAddress as `0x${string}`,
      functionName,
      args: args as any,
      value: BigInt(0),
      fees: { distribution: estimate.distribution, messageAllocations: estimate.messageAllocations, feeValue: estimate.feeValue },
    });

    return txHash;
  }

  public async proposeAliasSet(
    clientNonce: string,
    cveId: string,
    ghsaId = '',
    osvId = '',
    signer?: EIP1193Provider | { address: string }
  ): Promise<string> {
    return this.executeWrite(
      'propose_alias_set',
      [clientNonce.trim(), cveId.trim(), ghsaId.trim(), osvId.trim()],
      signer
    );
  }

  public async recordObjection(
    proposalId: number,
    reasonCode: string,
    note: string,
    signer?: EIP1193Provider | { address: string }
  ): Promise<string> {
    return this.executeWrite(
      'record_objection',
      [proposalId, reasonCode.trim(), note.trim()],
      signer
    );
  }

  public async assessProposal(
    proposalId: number,
    signer?: EIP1193Provider | { address: string }
  ): Promise<string> {
    return this.executeWrite('assess_proposal', [proposalId], signer);
  }

  public async retryUnresolved(
    proposalId: number,
    signer?: EIP1193Provider | { address: string }
  ): Promise<string> {
    return this.executeWrite('retry_unresolved', [proposalId], signer);
  }

  public async consumeIncident(
    contextHash: string,
    clusterOrAliasId: string,
    signer?: EIP1193Provider | { address: string }
  ): Promise<string> {
    return this.executeWrite(
      'consume_incident',
      [contextHash.trim(), clusterOrAliasId.trim()],
      signer
    );
  }

  // --- Transaction Truth Polling & Method-Specific Readback ---

  public async waitForFinalityAndReadback(
    txHash: string,
    intent: Pick<PendingOperation['intent'], 'method' | 'args' | 'caller'> & Partial<Pick<PendingOperation['intent'], 'timestamp' | 'description' | 'before'>>,
    onPollStatus?: (statusName: string) => void
  ): Promise<TransactionReceiptResult> {
    if (this.activePollingLocks.has(txHash)) {
      throw new Error(`Polling already active for transaction ${txHash}`);
    }
    this.activePollingLocks.add(txHash);

    try {
      onPollStatus?.('WAITING_FOR_FINALITY');
      const receipt = await this.client.waitForFinalization({
        hash: txHash as Hash,
        // Studio Dev consensus can legitimately take longer than genlayer-js's
        // 30-second default (10 polls x 3 seconds). Keep the UI truth-aligned
        // with the chain instead of surfacing a premature timeout failure.
        interval: 5000,
        retries: 24,
        // GenLayer execution metadata is required for the SUCCESS/ERROR gate.
        fullTransaction: true,
      } as any);
      const finalStatusName = String((receipt as any).statusName || 'UNKNOWN');
      onPollStatus?.('VERIFYING_EXECUTION');
      const explicitExecutionResult = (receipt as any).txExecutionResultName;
      const leaderExecutionResults = (((receipt as any).consensus_data?.leader_receipt || []) as Array<any>)
        .map((leaderReceipt) => leaderReceipt.execution_result || leaderReceipt.genvm_result?.execution_result)
        .filter(Boolean)
        .map((result) => String(result).toUpperCase());
      const agreedValidatorResults = (((receipt as any).consensus_data?.validators || []) as Array<any>)
        .filter((validator) => String(validator.vote || '').toLowerCase() === 'agree')
        .map((validator) => validator.genvm_result?.execution_result || validator.execution_result)
        .filter(Boolean)
        .map((result) => String(result).toUpperCase());
      const executionSucceeded = isSuccessful(receipt as any) ||
        explicitExecutionResult === ExecutionResult.FINISHED_WITH_RETURN ||
        (!explicitExecutionResult &&
          (leaderExecutionResults.length > 0
            ? leaderExecutionResults.some((result) => result === 'SUCCESS')
            : agreedValidatorResults.length > 0 && agreedValidatorResults.every((result) => result === 'SUCCESS')));
      if (finalStatusName !== 'FINALIZED') {
        throw new Error(`Transaction did not reach FINALIZED: ${finalStatusName}`);
      }
      if (!executionSucceeded) {
        throw new Error(`Transaction execution failed: ${String(explicitExecutionResult || agreedValidatorResults.join(',') || 'UNKNOWN')}`);
      }

      // Authoritative method-specific readback verification
      onPollStatus?.('VERIFYING_READBACK');
      this.invalidateCache();
      let readbackData: unknown = null;
      let readbackVerified = false;

      if (intent.method === 'propose_alias_set') {
        const [nonce] = intent.args as [string];
        const caller = intent.caller || '';
        const pid = await this.getProposalByNonce(caller, nonce);
        if (pid > 0) {
          const prop = await this.getProposal(pid);
          if (prop && (prop.status === 'PROPOSED' || prop.status === 'CONFLICT')) {
            readbackVerified = true;
            readbackData = prop;
          }
        }
      } else if (intent.method === 'record_objection') {
        const [pid, reasonCode, note] = intent.args as [number, string, string];
        const objections = await this.getObjections(pid, 0, 20);
        const expectedIndex = intent.before?.objectionCount;
        const newRecord = expectedIndex === undefined ? undefined : objections.find((item) =>
          item.index === expectedIndex &&
          item.reason_code === reasonCode.trim() &&
          item.note === note.trim().replace(/\s+/g, ' ') &&
          item.objector.toLowerCase() === (intent.caller || '').toLowerCase()
        );
        if (expectedIndex !== undefined && objections.length === expectedIndex + 1 && newRecord) {
          readbackVerified = true;
          readbackData = objections;
        }
      } else if (intent.method === 'assess_proposal' || intent.method === 'retry_unresolved') {
        const [pid] = intent.args as [number];
        const prop = await this.getProposal(pid);
        const history = await this.getAssessmentHistory(pid);
        const before = intent.before;
        const latest = prop?.latest_assessment;
        const newHistory = before ? history[before.historyTotal ?? -1] : undefined;
        if (prop && before && latest &&
          prop.attempts === (before.attempts ?? -1) + 1 &&
          history.length === (before.historyTotal ?? -1) + 1 &&
          prop.last_assessed_at !== before.lastAssessedAt &&
          newHistory?.fingerprint === latest.fingerprint &&
          newHistory?.outcome === latest.outcome) {
          readbackVerified = true;
          readbackData = prop;
        }
      } else if (intent.method === 'consume_incident') {
        const [contextHash, clusterOrAliasId] = intent.args as [string, string];
        const caller = intent.caller || '';
        const consumed = await this.isConsumed(caller, contextHash, clusterOrAliasId);
        const baseline = intent.before?.consumptionCount;
        const records = baseline === undefined ? [] : await this.getConsumptions(baseline, 1);
        const expectedIndex = (intent.before?.consumptionCount ?? -1) + 1;
        const record = records.find((item) => item.index === expectedIndex &&
          item.caller.toLowerCase() === caller.toLowerCase() && item.context_hash === contextHash.trim());
        if (consumed && baseline !== undefined && records.length === 1 && record) {
          readbackVerified = true;
          readbackData = record;
        }
      } else {
        readbackVerified = true;
      }

      if (!readbackVerified) {
        throw new Error(`Authoritative readback did not verify ${intent.method}`);
      }
      return {
        hash: txHash,
        status: 'SUCCESS',
        statusName: finalStatusName,
        executionResult: explicitExecutionResult || ExecutionResult.FINISHED_WITH_RETURN,
        readbackVerified,
        readbackData,
      };
    } finally {
      this.activePollingLocks.delete(txHash);
    }
  }
}

export const rpcClient = new GenLayerRpcClient();
