import React, { useState, useEffect } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { useWallet } from '../context/WalletContext';
import { ObjectionReasonCode, ObjectionRecord } from '../types';
import { formatDate, shortenAddress } from '../utils/validation';
import { MessageSquareWarning, AlertCircle, CheckCircle2, ShieldAlert, FileText, Send, Wallet } from 'lucide-react';

interface FileObjectionProps {
  initialProposalId?: number;
}

const REASON_CODES: { code: ObjectionReasonCode; label: string; description: string }[] = [
  {
    code: 'DIFFERENT_ROOT_CAUSE',
    label: 'Different Root Cause',
    description: 'The records describe distinct flaws or trigger mechanisms.',
  },
  {
    code: 'SEPARATE_RELEASES',
    label: 'Separate Releases',
    description: 'The evidence points to separate release or remediation lifecycles.',
  },
  {
    code: 'ECOSYSTEM_SPLIT',
    label: 'Ecosystem Split',
    description: 'The package coordinates belong to different ecosystems.',
  },
  {
    code: 'VENDOR_DISPUTE',
    label: 'Vendor Dispute',
    description: 'A vendor or maintainer disputes the proposed identity mapping.',
  },
  {
    code: 'OTHER',
    label: 'Other Provenance Discrepancy',
    description: 'Data quality issue, upstream retraction, or other registry inconsistency.',
  },
];

export const FileObjection: React.FC<FileObjectionProps> = ({ initialProposalId }) => {
  const { proposals, fileObjection, getObjectionsForProposal } = useRegistry();
  const { isConnected, openWalletModal } = useWallet();

  const proposedOnly = proposals.filter((p) => p.status === 'PROPOSED' || p.status === 'UNRESOLVED');

  const [selectedPid, setSelectedPid] = useState<number>(
    initialProposalId && proposedOnly.some((p) => p.proposal_id === initialProposalId)
      ? initialProposalId
      : proposedOnly[0]?.proposal_id || 0
  );

  const [reasonCode, setReasonCode] = useState<ObjectionReasonCode>('DIFFERENT_ROOT_CAUSE');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historicalObjections, setHistoricalObjections] = useState<ObjectionRecord[]>([]);
  const [loadingObjections, setLoadingObjections] = useState(false);

  useEffect(() => {
    if (initialProposalId && proposedOnly.some((p) => p.proposal_id === initialProposalId)) {
      setSelectedPid(initialProposalId);
    } else if (proposedOnly.length > 0 && (!selectedPid || !proposedOnly.some((p) => p.proposal_id === selectedPid))) {
      setSelectedPid(proposedOnly[0].proposal_id);
    }
  }, [initialProposalId, proposedOnly, selectedPid]);

  useEffect(() => {
    if (selectedPid > 0) {
      setLoadingObjections(true);
      getObjectionsForProposal(selectedPid)
        .then((objs) => setHistoricalObjections(objs))
        .catch(() => setHistoricalObjections([]))
        .finally(() => setLoadingObjections(false));
    } else {
      setHistoricalObjections([]);
    }
  }, [selectedPid, getObjectionsForProposal]);

  const MAX_NOTE_LEN = 280;
  const cleanNote = note.trim();
  const isValidNote = cleanNote.length > 0 && cleanNote.length <= MAX_NOTE_LEN;
  const currentProposal = proposals.find((p) => p.proposal_id === selectedPid);
  const isCapReached = currentProposal ? currentProposal.objection_count >= 8 : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPid || !isValidNote || isSubmitting || isCapReached || !isConnected) return;

    setIsSubmitting(true);
    try {
      await fileObjection(selectedPid, reasonCode, cleanNote);
      setNote('');
      // Reload objections list
      const updated = await getObjectionsForProposal(selectedPid);
      setHistoricalObjections(updated);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquareWarning className="w-5 h-5 text-amber-400" />
          File Formal Objection
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Submit bounded evidence and rationale against pending proposals before consensus finalization
        </p>
      </div>

      {proposedOnly.length === 0 ? (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-10 text-center">
          <ShieldAlert className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-200 mb-1">No Active Proposals Open for Objection</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Objections can be recorded while a proposal is pending or unresolved. No current proposal is open for objection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Objection Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-5"
          >
            {/* Target Proposal Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                Select Target Proposal <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedPid}
                onChange={(e) => setSelectedPid(Number(e.target.value))}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500 transition"
              >
                {proposedOnly.map((p) => (
                  <option key={p.proposal_id} value={p.proposal_id}>
                    Proposal #{p.proposal_id}: {p.canonical_ids.join(' + ')} ({p.objection_count}/8 objections)
                  </option>
                ))}
              </select>
            </div>

            {/* Reason Code */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">
                Reason Code <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {REASON_CODES.map((rc) => (
                  <label
                    key={rc.code}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      reasonCode === rc.code
                        ? 'bg-amber-500/10 border-amber-500/40 text-white'
                        : 'bg-gray-950 border-gray-800 hover:border-gray-700 text-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reasonCode"
                      value={rc.code}
                      checked={reasonCode === rc.code}
                      onChange={() => setReasonCode(rc.code)}
                      className="mt-0.5 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white">{rc.label}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{rc.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Note / Justification */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300">
                  Factual Note / Technical Citation <span className="text-red-400">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    cleanNote.length > MAX_NOTE_LEN ? 'text-red-400 font-bold' : 'text-gray-500'
                  }`}
                >
                  {cleanNote.length} / {MAX_NOTE_LEN}
                </span>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="State the concrete package discrepancy, version gap, or independent advisory link..."
                className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition resize-none"
              />
              {cleanNote.length > MAX_NOTE_LEN && (
                <p className="text-[11px] text-red-400">Note exceeds maximum limit of 280 characters.</p>
              )}
            </div>

            {/* Cap Warning */}
            {isCapReached && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Maximum objection capacity (8/8) reached for Proposal #{selectedPid}.</span>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                {!isConnected && (
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Wallet required to object
                  </span>
                )}
              </span>
              {isConnected ? (
                <button
                  type="submit"
                  disabled={!isValidNote || isSubmitting || isCapReached}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-amber-500/10 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Recording Objection...' : 'Submit Formal Objection'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openWalletModal}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md transition"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>
          </form>

          {/* Historical Objections on Selected Proposal */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Recorded Objections ({historicalObjections.length} / 8)
                </h3>
                <span className="text-[10px] font-mono text-gray-500">Proposal #{selectedPid}</span>
              </div>

              {loadingObjections ? (
                <div className="py-8 text-center text-xs text-gray-500">Loading objections...</div>
              ) : historicalObjections.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">No objections filed yet</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    This proposal is currently uncontested.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {historicalObjections.map((obj) => (
                    <div
                      key={obj.index}
                      className="p-3 bg-gray-950 border border-gray-800 rounded-lg text-xs space-y-2 font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400 font-semibold text-[11px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {obj.reason_code}
                        </span>
                        <span className="text-[10px] text-gray-500">Index #{obj.index}</span>
                      </div>
                      <p className="text-gray-300 text-xs">{obj.note}</p>
                      <div className="pt-1 border-t border-gray-900 flex items-center justify-between text-[10px] text-gray-500">
                        <span>Objector: {shortenAddress(obj.objector)}</span>
                        <span>{formatDate(obj.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
