import React, { useState, useEffect } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { AssessmentRecord, ProposalRecord, ProposalStatus } from '../types';
import { rpcClient } from '../services/rpcClient';
import { formatDate, shortenAddress, computeRemainingCooldown } from '../utils/validation';
import {
  Activity,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Layers,
  MessageSquareWarning,
  Fingerprint,
} from 'lucide-react';

interface ProposalAssessmentTrackerProps {
  onNavigateToObjection: (proposalId: number) => void;
}

export const ProposalAssessmentTracker: React.FC<ProposalAssessmentTrackerProps> = ({
  onNavigateToObjection,
}) => {
  const { proposals, assessProposal, retryUnresolved } = useRegistry();
  const [filter, setFilter] = useState<ProposalStatus | 'ALL'>('ALL');
  const [selectedProposal, setSelectedProposal] = useState<ProposalRecord | null>(null);
  const [cooldownTicks, setCooldownTicks] = useState<Record<number, number>>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentRecord[]>([]);

  useEffect(() => {
    let active = true;
    if (!selectedProposal) { setAssessmentHistory([]); return; }
    rpcClient.getAssessmentHistory(selectedProposal.proposal_id)
      .then((items) => { if (active) setAssessmentHistory(items); })
      .catch(() => { if (active) setAssessmentHistory([]); });
    return () => { active = false; };
  }, [selectedProposal]);

  // Update cooldown countdown timer every second
  useEffect(() => {
    const updateCooldowns = () => {
      const newTicks: Record<number, number> = {};
      proposals.forEach((p) => {
        if (p.status === 'UNRESOLVED' && p.last_assessed_at) {
          newTicks[p.proposal_id] = computeRemainingCooldown(p.last_assessed_at, 600);
        }
      });
      setCooldownTicks(newTicks);
    };

    updateCooldowns();
    const interval = setInterval(updateCooldowns, 1000);
    return () => clearInterval(interval);
  }, [proposals]);

  const filteredProposals = proposals.filter((p) => (filter === 'ALL' ? true : p.status === filter));

  const handleAssess = async (e: React.MouseEvent, proposalId: number) => {
    e.stopPropagation();
    setActionLoading(proposalId);
    try {
      await assessProposal(proposalId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = async (e: React.MouseEvent, proposalId: number) => {
    e.stopPropagation();
    setActionLoading(proposalId);
    try {
      await retryUnresolved(proposalId);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'PROPOSED':
        return (
          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono rounded flex items-center gap-1">
            <Activity className="w-3 h-3" /> PROPOSED
          </span>
        );
      case 'MERGED':
        return (
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> MERGED
          </span>
        );
      case 'KEPT_SEPARATE':
        return (
          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono rounded flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> KEPT_SEPARATE
          </span>
        );
      case 'UNRESOLVED':
        return (
          <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-mono rounded flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> UNRESOLVED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Proposal Assessment Tracker
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Monitor and execute GenLayer multi-agent consensus adjudication and source evidence ingestion
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1 text-xs">
          {(['ALL', 'PROPOSED', 'MERGED', 'KEPT_SEPARATE', 'UNRESOLVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1 rounded-md transition font-medium text-[11px] ${
                filter === st ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-12 text-center">
          <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-200 mb-1">No proposals found</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            No proposal currently matches filter &quot;{filter}&quot;.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProposals.map((prop) => {
            const remainingCooldown = cooldownTicks[prop.proposal_id] || 0;
            const isAssessing = actionLoading === prop.proposal_id;

            return (
              <div
                key={prop.proposal_id}
                onClick={() => setSelectedProposal(prop)}
                className="bg-gray-900/80 hover:bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 cursor-pointer transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                      Proposal #{prop.proposal_id}
                    </span>
                    {getStatusBadge(prop.status)}
                    <span className="text-[11px] text-gray-500 font-mono">
                      Proposer: {shortenAddress(prop.proposer)}
                    </span>
                    {prop.objection_count > 0 && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                        {prop.objection_count} Objection(s)
                      </span>
                    )}
                  </div>

                  {/* Candidate Identifiers */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-gray-400 font-medium">Candidate Aliases:</span>
                    {prop.canonical_ids.map((id) => (
                      <span
                        key={id}
                        className="text-xs font-mono font-semibold text-gray-200 bg-gray-950 px-2 py-0.5 rounded border border-gray-800"
                      >
                        {id}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono">
                    <span>Created: {formatDate(prop.created_at)}</span>
                    {prop.last_assessed_at && <span>Assessed: {formatDate(prop.last_assessed_at)}</span>}
                    <span>Attempts: {prop.attempts}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {prop.status === 'PROPOSED' && (
                    <>
                      <button
                        onClick={() => onNavigateToObjection(prop.proposal_id)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg border border-gray-700 transition flex items-center gap-1.5"
                        title="File formal objection"
                      >
                        <MessageSquareWarning className="w-3.5 h-3.5 text-amber-400" />
                        <span>Object</span>
                      </button>
                      <button
                        onClick={(e) => handleAssess(e, prop.proposal_id)}
                        disabled={isAssessing}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-500/10 transition flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isAssessing ? 'Consensus Ingesting...' : 'Assess Proposal'}</span>
                      </button>
                    </>
                  )}

                  {prop.status === 'UNRESOLVED' && (
                    <button
                      onClick={(e) => handleRetry(e, prop.proposal_id)}
                      disabled={remainingCooldown > 0 || isAssessing}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs font-semibold rounded-lg shadow-md transition flex items-center gap-1.5"
                      title={remainingCooldown > 0 ? `Cooldown active (${remainingCooldown}s remaining)` : 'Retry assessment'}
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isAssessing ? 'animate-spin' : ''}`} />
                      <span>
                        {remainingCooldown > 0
                          ? `Retry in ${remainingCooldown}s`
                          : isAssessing
                          ? 'Retrying...'
                          : 'Retry Assessment'}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedProposal(prop)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg border border-gray-700 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proposal Details Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-400 font-mono font-bold">
                    Proposal #{selectedProposal.proposal_id}
                  </span>
                  {getStatusBadge(selectedProposal.status)}
                </div>
                <h2 className="text-lg font-bold font-mono text-white mt-1">
                  {selectedProposal.canonical_ids.join('  +  ')}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
              >
                &times;
              </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-950 rounded-lg border border-gray-800 text-xs font-mono">
              <div>
                <span className="text-gray-500 block text-[10px]">PROPOSER</span>
                <span className="text-gray-200">{shortenAddress(selectedProposal.proposer)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">CLIENT NONCE</span>
                <span className="text-gray-200 truncate block">{selectedProposal.client_nonce}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">ATTEMPTS</span>
                <span className="text-gray-200">{selectedProposal.attempts} / 3</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">OBJECTIONS</span>
                <span className="text-gray-200">{selectedProposal.objection_count} / 8</span>
              </div>
            </div>

            {/* Assessment Breakdown */}
            {selectedProposal.latest_assessment ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 border border-gray-700/70 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Consensus Adjudication Report ({selectedProposal.latest_assessment.outcome})
                    </h4>
                    <span className="text-xs font-mono px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded">
                      Outcome: {selectedProposal.latest_assessment.outcome}
                    </span>
                  </div>

                  <div className="text-xs text-gray-300 bg-gray-900/80 p-3 rounded-lg border border-gray-800 font-mono">
                    {selectedProposal.latest_assessment.reason}
                  </div>

                  {/* Relations and Bands */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
                    <div className="bg-gray-950 p-2 rounded border border-gray-800">
                      <span className="text-gray-500 block text-[9px]">PACKAGE RELATION</span>
                      <span className="text-gray-300">{selectedProposal.latest_assessment.package_relation || 'N/A'}</span>
                    </div>
                    <div className="bg-gray-950 p-2 rounded border border-gray-800">
                      <span className="text-gray-500 block text-[9px]">RANGE RELATION</span>
                      <span className="text-gray-300">{selectedProposal.latest_assessment.range_relation || 'N/A'}</span>
                    </div>
                    <div className="bg-gray-950 p-2 rounded border border-gray-800">
                      <span className="text-gray-500 block text-[9px]">CROSS REFERENCE</span>
                      <span className="text-gray-300">{selectedProposal.latest_assessment.cross_reference_band || 'N/A'}</span>
                    </div>
                    <div className="bg-gray-950 p-2 rounded border border-gray-800">
                      <span className="text-gray-500 block text-[9px]">ROOT CAUSE</span>
                      <span className="text-gray-300">{selectedProposal.latest_assessment.root_cause_band || 'N/A'}</span>
                    </div>
                  </div>

                  {selectedProposal.latest_assessment.fingerprint && (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono pt-1">
                      <Fingerprint className="w-3.5 h-3.5 text-gray-500" />
                      <span className="truncate">Fingerprint: {selectedProposal.latest_assessment.fingerprint}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono pt-1 border-t border-gray-800">
                    <span>
                      Successful Sources ({selectedProposal.latest_assessment.successful_sources?.length || 0}):{' '}
                      {selectedProposal.latest_assessment.successful_sources?.join(', ') || 'None'}
                    </span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Validator Consensus Confirmed
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-3">Bounded assessment history ({assessmentHistory.length} / 3)</h4>
                  {assessmentHistory.length === 0 ? <p className="text-[11px] text-gray-500">No earlier assessment snapshot is available.</p> : (
                    <ol className="space-y-2">
                      {assessmentHistory.map((item, index) => <li key={`${item.fingerprint}-${index}`} className="flex items-start justify-between gap-3 border-l-2 border-blue-500/40 pl-3 text-[11px] font-mono"><span><strong className="text-white">{item.outcome}</strong><span className="block text-gray-500">{item.reason}</span></span><span className="text-gray-600">#{item.history_index ?? index + 1}</span></li>)}
                    </ol>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gray-800/30 border border-gray-800 rounded-xl text-center">
                <Activity className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs text-gray-300 font-medium">No assessment performed yet</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Click &quot;Assess Proposal&quot; to fetch official NVD, GHSA, and OSV evidence and invoke consensus.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
              {selectedProposal.status === 'PROPOSED' ? (
                <button
                  onClick={() => {
                    const pid = selectedProposal.proposal_id;
                    setSelectedProposal(null);
                    onNavigateToObjection(pid);
                  }}
                  className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-amber-400 text-xs font-semibold rounded-lg border border-amber-500/20 transition flex items-center gap-1.5"
                >
                  <MessageSquareWarning className="w-4 h-4" />
                  File Formal Objection
                </button>
              ) : (
                <div></div>
              )}

              <button
                onClick={() => setSelectedProposal(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
