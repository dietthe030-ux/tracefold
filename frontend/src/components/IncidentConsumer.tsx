import React, { useState } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { useWallet } from '../context/WalletContext';
import { formatDate, shortenAddress } from '../utils/validation';
import { ShieldAlert, CheckCircle2, AlertTriangle, Play, RefreshCw, Hash, FileCheck2, Database, AlertCircle, Wallet } from 'lucide-react';

export const IncidentConsumer: React.FC = () => {
  const { clusters, consumptions, consumeIncident } = useRegistry();
  const { isConnected, account, openWalletModal } = useWallet();

  const [selectedClusterId, setSelectedClusterId] = useState<number>(clusters[0]?.cluster_id || 1);
  const [contextHash, setContextHash] = useState('INCIDENT-2026-SECOPS-8841');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{
    caller: string;
    clusterId: number;
    contextHash: string;
    timestamp: string;
  } | null>(null);

  const selectedCluster = clusters.find((c) => c.cluster_id === selectedClusterId);

  const handleConsume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClusterId || !contextHash.trim() || isSubmitting || !isConnected) return;

    setIsSubmitting(true);
    try {
      await consumeIncident(contextHash.trim(), String(selectedClusterId));
      setLastReceipt({
        caller: account || '0x0000000000000000000000000000000000000000',
        clusterId: selectedClusterId,
        contextHash: contextHash.trim(),
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplayTest = async () => {
    if (!lastReceipt || !isConnected) return;
    setIsSubmitting(true);
    try {
      await consumeIncident(lastReceipt.contextHash, String(lastReceipt.clusterId));
    } catch {
      // Expected rejection
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
          Downstream Incident Exact-Once Consumer
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Downstream SIEM, SOAR, and vulnerability scanners consume canonical clusters with cryptographic deduplication
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Consumption Form */}
        <form
          onSubmit={handleConsume}
          className="lg:col-span-6 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-5"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-gray-800">
            <FileCheck2 className="w-4 h-4 text-blue-400" />
            Consume Canonical Cluster
          </div>

          {/* Select Cluster */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-300">
              Canonical Cluster <span className="text-red-400">*</span>
            </label>
            {clusters.length === 0 ? (
              <p className="text-xs text-amber-400">No clusters available. Please create and merge a proposal first.</p>
            ) : (
              <select
                value={selectedClusterId}
                onChange={(e) => setSelectedClusterId(Number(e.target.value))}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500 transition"
              >
                {clusters.map((c) => (
                  <option key={c.cluster_id} value={c.cluster_id}>
                    Cluster #{c.cluster_id}: {c.canonical_display_id} ({c.aliases.length} aliases)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Cluster Aliases Preview */}
          {selectedCluster && (
            <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 space-y-1.5 font-mono text-xs">
              <span className="text-[11px] text-gray-400">Mapped Invariant Aliases:</span>
              <div className="flex flex-wrap gap-1">
                {selectedCluster.aliases.map((a) => (
                  <span key={a} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 text-[10px]">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Context Hash / Incident ID */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300">
                Incident Context Hash / Ticket ID <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setContextHash(`INCIDENT-${Date.now().toString().slice(-6)}-SECOPS`)}
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-mono"
              >
                <RefreshCw className="w-3 h-3" /> New Ticket ID
              </button>
            </div>
            <div className="relative">
              <Hash className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={contextHash}
                onChange={(e) => setContextHash(e.target.value)}
                placeholder="e.g. INCIDENT-2026-SECOPS-8841 or sha256:..."
                className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <p className="text-[10px] text-gray-500 font-mono">
              Keyed on <code>caller + context_hash + cluster_id</code> ensuring exactly-once processing across downstream microservices.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              {!isConnected && (
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Wallet required to consume
                </span>
              )}
            </span>
            {isConnected ? (
              <button
                type="submit"
                disabled={clusters.length === 0 || !contextHash.trim() || isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-emerald-500/10 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                {isSubmitting ? 'Consuming...' : 'Consume Incident'}
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

        {/* Receipt & Replay Resistance Demonstration */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Exact-Once Invariant Verification
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Deduplication Active
              </span>
            </div>

            {lastReceipt ? (
              <div className="p-4 bg-gray-950 border border-emerald-500/30 rounded-lg space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Consumption Succeeded
                </div>
                <div className="space-y-1 text-gray-300 text-[11px]">
                  <div>Caller: {shortenAddress(lastReceipt.caller)}</div>
                  <div>Cluster ID: #{lastReceipt.clusterId}</div>
                  <div>Context Hash: {lastReceipt.contextHash}</div>
                  <div>Timestamp: {formatDate(lastReceipt.timestamp)}</div>
                </div>

                <div className="pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={handleReplayTest}
                    disabled={isSubmitting || !isConnected}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 disabled:bg-gray-800 disabled:text-gray-600 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Test Replay Rejection (Consume Again)
                  </button>
                  <p className="text-[10px] text-gray-500 mt-1 text-center">
                    Demonstrates strict exact-once revert when attempting to re-consume the same context.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-gray-500">
                Execute a consumption above to inspect the receipt and test replay deduplication.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Consumption Ledger */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            Consumption Ledger History ({consumptions.length} / 512)
          </h3>
          <span className="text-[10px] font-mono text-gray-500">Cap: 512 records</span>
        </div>

        {consumptions.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">No consumptions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="pb-2">Index</th>
                  <th className="pb-2">Caller</th>
                  <th className="pb-2">Context Hash</th>
                  <th className="pb-2">Cluster ID</th>
                  <th className="pb-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {consumptions.map((c) => (
                  <tr key={c.index} className="text-gray-300 hover:bg-gray-800/40">
                    <td className="py-2.5 font-bold text-blue-400">#{c.index}</td>
                    <td className="py-2.5 text-gray-400">{shortenAddress(c.caller)}</td>
                    <td className="py-2.5 text-white font-semibold">{c.context_hash}</td>
                    <td className="py-2.5 text-emerald-400">Cluster #{c.cluster_id}</td>
                    <td className="py-2.5 text-gray-500">{formatDate(c.consumed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
