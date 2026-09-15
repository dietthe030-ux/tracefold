import React, { useState, useMemo } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { ClusterRecord } from '../types';
import { formatDate } from '../utils/validation';
import { Search, Network, ExternalLink, ShieldCheck, Layers, Calendar, Fingerprint } from 'lucide-react';

interface ClusterExplorerProps {
  onNavigateToPropose: () => void;
}

export const ClusterExplorer: React.FC<ClusterExplorerProps> = ({ onNavigateToPropose }) => {
  const { clusters } = useRegistry();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<ClusterRecord | null>(null);

  const filteredClusters = useMemo(() => {
    if (!searchTerm.trim()) return clusters;
    const term = searchTerm.trim().toLowerCase();
    return clusters.filter(
      (c) =>
        c.canonical_display_id.toLowerCase().includes(term) ||
        c.aliases.some((a) => a.toLowerCase().includes(term))
    );
  }, [clusters, searchTerm]);

  const getSourceBadgeColor = (alias: string) => {
    if (alias.startsWith('CVE-')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (alias.startsWith('GHSA-')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  };

  const getRegistryUrl = (alias: string) => {
    if (alias.startsWith('CVE-')) return `https://nvd.nist.gov/vuln/detail/${alias}`;
    if (alias.startsWith('GHSA-')) return `https://github.com/advisories/${alias}`;
    return `https://osv.dev/vulnerability/${alias}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-400" />
            Canonical Vulnerability Clusters
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Immutable, append-only alias clusters adjudicated by multi-source GenLayer consensus
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by CVE, GHSA, OSV..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Cluster Grid */}
      {filteredClusters.length === 0 ? (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-12 text-center">
          <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-200 mb-1">
            {searchTerm ? 'No matching clusters found' : 'No canonical clusters formed yet'}
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-5">
            {searchTerm
              ? `No vulnerability cluster matches "${searchTerm}". Try a different identifier or propose a new alias pair.`
              : 'Propose new alias sets from NVD, GitHub Advisories, and OSV to trigger multi-agent consensus merge.'}
          </p>
          <button
            onClick={onNavigateToPropose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-blue-500/10"
          >
            Propose Alias Pair
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClusters.map((cluster) => (
            <div
              key={cluster.cluster_id}
              onClick={() => setSelectedCluster(cluster)}
              className="bg-gray-900/80 hover:bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 cursor-pointer transition flex flex-col justify-between group shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono text-gray-500 bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">
                    Cluster #{cluster.cluster_id}
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3 h-3" /> Canonical
                  </span>
                </div>

                <h3 className="font-mono text-base font-bold text-white group-hover:text-blue-400 transition mb-3">
                  {cluster.canonical_display_id}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="text-[11px] text-gray-400 font-medium">Mapped Aliases ({cluster.aliases.length}):</div>
                  <div className="flex flex-wrap gap-1.5">
                    {cluster.aliases.map((alias) => (
                      <span
                        key={alias}
                        className={`text-[11px] font-mono px-2 py-0.5 rounded border ${getSourceBadgeColor(alias)}`}
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>

                {cluster.merge_fingerprint && (
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono mb-3">
                    <Fingerprint className="w-3 h-3 text-gray-500" />
                    <span className="truncate">{cluster.merge_fingerprint.slice(0, 18)}...</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(cluster.updated_at)}
                </span>
                <span className="text-blue-400 group-hover:underline">View Evidence &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cluster Detail Modal */}
      {selectedCluster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
              <div>
                <div className="text-xs text-blue-400 font-mono">Cluster #{selectedCluster.cluster_id}</div>
                <h2 className="text-xl font-bold font-mono text-white mt-0.5">
                  {selectedCluster.canonical_display_id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCluster(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Adjudicated Canonical Aliases
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCluster.aliases.map((alias) => (
                    <a
                      key={alias}
                      href={getRegistryUrl(alias)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 rounded-lg group transition text-xs font-mono"
                    >
                      <span className="text-gray-200 group-hover:text-blue-400">{alias}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400" />
                    </a>
                  ))}
                </div>
              </div>

              {selectedCluster.merge_fingerprint && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Consensus Merge Fingerprint
                  </h4>
                  <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800 text-xs font-mono text-gray-300 break-all">
                    {selectedCluster.merge_fingerprint}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono text-gray-400">
                <div>
                  <span className="text-gray-500 block">Created At:</span>
                  {formatDate(selectedCluster.created_at)}
                </div>
                <div>
                  <span className="text-gray-500 block">Last Mutated At:</span>
                  {formatDate(selectedCluster.updated_at)}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
              <button
                onClick={() => setSelectedCluster(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold transition"
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
