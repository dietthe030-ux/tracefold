// EIP-6963 Provider Discovery Types
export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (eventName: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (eventName: string, handler: (...args: unknown[]) => void) => void;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: EIP6963ProviderDetail;
}

// Supported EIP-6963 RDNS identifiers strictly
export const SUPPORTED_RDNS = {
  METAMASK: 'io.metamask',
  OKX: 'com.okx.wallet',
  RABBY: 'io.rabby',
} as const;

export type SupportedRdns = (typeof SUPPORTED_RDNS)[keyof typeof SUPPORTED_RDNS];

// Studio Dev Chain Constants
export const STUDIO_DEVNET_CHAIN_ID = 61997;
export const STUDIO_DEVNET_CHAIN_ID_HEX = '0xf22d';
export const STUDIO_DEVNET_RPC_URL = 'https://studio-dev.genlayer.com/api';
export const STUDIO_DEVNET_EXPLORER_URL = 'https://explorer-studio-dev.genlayer.com';

// Registry Domain Models
export type ProposalStatus = 'PROPOSED' | 'MERGED' | 'KEPT_SEPARATE' | 'UNRESOLVED' | 'CONFLICT';
export type AssessmentOutcome = 'SAME_VULNERABILITY' | 'DISTINCT' | 'RELATED_NOT_SAME' | 'UNRESOLVED';
export type ObjectionReasonCode =
  | 'DIFFERENT_ROOT_CAUSE'
  | 'SEPARATE_RELEASES'
  | 'ECOSYSTEM_SPLIT'
  | 'VENDOR_DISPUTE'
  | 'OTHER';

export interface AssessmentRecord {
  outcome: AssessmentOutcome;
  canonical_ids: string[];
  successful_sources: string[];
  source_revisions: Record<string, string>;
  source_statuses: Record<string, number>;
  package_relation: string;
  range_relation: string;
  cross_reference_band: string;
  root_cause_band: string;
  target_cluster_id?: number;
  cluster_id?: number;
  fingerprint: string;
  reason: string;
  assessed_at?: string;
  history_index?: number;
  objection_guard_applied?: boolean;
}

export interface ProposalRecord {
  proposal_id: number;
  proposer: string;
  client_nonce: string;
  canonical_ids: string[];
  status: ProposalStatus;
  attempts: number;
  objection_count: number;
  cluster_id?: number;
  created_at: string;
  last_assessed_at: string;
  latest_assessment: AssessmentRecord | null;
  conflicting_cluster_ids?: number[];
  conflict_reason?: string;
  objection_status?: string;
  objection_effect?: string;
}

export interface ClusterRecord {
  cluster_id: number;
  canonical_display_id: string;
  aliases: string[];
  created_proposal_id?: number;
  merge_fingerprint?: string;
  created_at: string;
  updated_at: string;
}

export interface ObjectionRecord {
  proposal_id: number;
  index: number;
  objector: string;
  reason_code: ObjectionReasonCode;
  note: string;
  created_at: string;
}

export interface ConsumptionRecord {
  index: number;
  caller: string;
  context_hash: string;
  cluster_id: number;
  consumed_at: string;
}

export interface RegistryCounts {
  proposal_count: number;
  cluster_count: number;
  consumption_count: number;
  max_proposals: number;
  max_clusters: number;
  max_aliases_per_cluster: number;
  max_objections_per_proposal: number;
  max_assessments_per_proposal: number;
  max_consumptions: number;
}

// Transaction Tracking & Reconciliation Types
export type TransactionState = 'IDLE' | 'WAITING_FOR_WALLET' | 'SUBMITTED' | 'WAITING_FOR_FINALITY' | 'VERIFYING_EXECUTION' | 'VERIFYING_READBACK' | 'SUCCESS' | 'REJECTED' | 'FAILED' | 'RECONCILIATION_REQUIRED';

export interface TransactionStatus {
  state: TransactionState;
  hash?: string;
  method?: string;
  description?: string;
  error?: string;
  timestamp?: number;
}

export interface PendingOperation {
  id: string;
  intent: {
    method: 'propose_alias_set' | 'record_objection' | 'assess_proposal' | 'retry_unresolved' | 'consume_incident';
    args: unknown[];
    caller: string;
    timestamp: number;
    description: string;
    before?: {
      objectionCount?: number;
      attempts?: number;
      historyTotal?: number;
      lastAssessedAt?: string;
      fingerprint?: string;
      consumptionCount?: number;
    };
  };
  hash?: string;
  submittedAt?: number;
  status: 'SIGNING' | 'PENDING' | 'RECONCILING' | 'CONFIRMED' | 'FAILED';
  error?: string;
}

// Toast Notifications
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: number;
}
