import React, { useState, useEffect } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { useWallet } from '../context/WalletContext';
import { validateAlias, generateNonce } from '../utils/validation';
import { PlusCircle, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert, Sparkles, ArrowRight, Wallet } from 'lucide-react';

interface ProposeAliasSetProps {
  onSuccessNavigate: (proposalId: number) => void;
}

export const ProposeAliasSet: React.FC<ProposeAliasSetProps> = ({ onSuccessNavigate }) => {
  const { proposeAliasSet, clusters } = useRegistry();
  const { isConnected, openWalletModal } = useWallet();

  const [id1, setId1] = useState('CVE-2024-3094');
  const [id2, setId2] = useState('GHSA-42xw-2xvc-cx4x');
  const [id3, setId3] = useState('');
  const [clientNonce, setClientNonce] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  useEffect(() => {
    setClientNonce(generateNonce());
  }, []);

  const val1 = validateAlias(id1);
  const val2 = validateAlias(id2);
  const val3 = id3.trim()
    ? validateAlias(id3)
    : { valid: true, error: undefined as string | undefined, normalized: '', type: 'UNKNOWN' as const };

  // Check if identical identifiers provided
  const normalizedSet = new Set(
    [val1.normalized, val2.normalized, val3.normalized].filter((x) => x && x.length > 0)
  );
  const hasDuplicatesInInput =
    normalizedSet.size !== [id1, id2, id3].filter((x) => x.trim().length > 0).length;

  // Check if any ID already mapped in existing clusters
  const mappedClusterMatches = clusters.filter((c) =>
    c.aliases.some((a) => normalizedSet.has(a.toUpperCase()))
  );

  const isValid =
    val1.valid &&
    val2.valid &&
    val3.valid &&
    !hasDuplicatesInInput &&
    clientNonce.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting || !isConnected) return;

    setIsSubmitting(true);
    try {
      const prop = await proposeAliasSet(
        clientNonce,
        val1.normalized,
        val2.normalized,
        val3.normalized || ''
      );
      if (prop && prop.proposal_id) {
        setSubmittedId(prop.proposal_id);
      }
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillSample = (sample: 'XZ' | 'WEBP' | 'CURL') => {
    if (sample === 'XZ') {
      setId1('CVE-2024-3094');
      setId2('GHSA-42xw-2xvc-cx4x');
      setId3('OSV-XZ-BACKDOOR-2024');
    } else if (sample === 'WEBP') {
      setId1('CVE-2023-4863');
      setId2('GHSA-j7hp-h8jx-5ppr');
      setId3('');
    } else {
      setId1('CVE-2023-38545');
      setId2('GHSA-v2c9-h5x8-8whx');
      setId3('OSV-CURL-SOCKS5-2023');
    }
    setClientNonce(generateNonce());
    setSubmittedId(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-blue-400" />
          Propose Vulnerability Alias Set
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Submit 2 to 3 candidate vulnerability identifiers across NVD (CVE), GitHub Advisories (GHSA), or OSV for consensus adjudication
        </p>
      </div>

      {/* Preset Quick Fill */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Quick Sample Pairs:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleFillSample('XZ')}
            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-mono rounded border border-gray-700 transition"
          >
            XZ Utils Backdoor
          </button>
          <button
            type="button"
            onClick={() => handleFillSample('WEBP')}
            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-mono rounded border border-gray-700 transition"
          >
            libwebp Buffer Overflow
          </button>
          <button
            type="button"
            onClick={() => handleFillSample('CURL')}
            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-mono rounded border border-gray-700 transition"
          >
            curl SOCKS5 Heap Overflow
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-5">
        {/* Identifier 1 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-300">
            Primary Vulnerability Identifier (CVE / GHSA / OSV) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={id1}
              onChange={(e) => {
                setId1(e.target.value);
                setSubmittedId(null);
              }}
              placeholder="e.g. CVE-2024-3094"
              className={`w-full bg-gray-950 border rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder-gray-600 focus:outline-none transition ${
                val1.valid ? 'border-gray-700 focus:border-blue-500' : 'border-red-500/80 focus:border-red-500'
              }`}
            />
            {id1 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {val1.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            )}
          </div>
          {id1 && !val1.valid && <p className="text-[11px] text-red-400 font-mono">{val1.error}</p>}
        </div>

        {/* Identifier 2 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-300">
            Candidate Alias Identifier 2 (CVE / GHSA / OSV) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={id2}
              onChange={(e) => {
                setId2(e.target.value);
                setSubmittedId(null);
              }}
              placeholder="e.g. GHSA-42xw-2xvc-cx4x"
              className={`w-full bg-gray-950 border rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder-gray-600 focus:outline-none transition ${
                val2.valid ? 'border-gray-700 focus:border-blue-500' : 'border-red-500/80 focus:border-red-500'
              }`}
            />
            {id2 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {val2.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            )}
          </div>
          {id2 && !val2.valid && <p className="text-[11px] text-red-400 font-mono">{val2.error}</p>}
        </div>

        {/* Identifier 3 (Optional) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-300">
            Candidate Alias Identifier 3 <span className="text-gray-500 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={id3}
              onChange={(e) => {
                setId3(e.target.value);
                setSubmittedId(null);
              }}
              placeholder="e.g. OSV-XZ-BACKDOOR-2024 (optional)"
              className={`w-full bg-gray-950 border rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder-gray-600 focus:outline-none transition ${
                val3.valid ? 'border-gray-700 focus:border-blue-500' : 'border-red-500/80 focus:border-red-500'
              }`}
            />
            {id3 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {val3.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            )}
          </div>
          {id3 && !val3.valid && <p className="text-[11px] text-red-400 font-mono">{val3.error}</p>}
        </div>

        {/* Duplicate warning */}
        {hasDuplicatesInInput && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Duplicate identifiers provided in the same proposal. All identifiers must be distinct.</span>
          </div>
        )}

        {/* Mapped cluster advisory */}
        {mappedClusterMatches.length > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5 text-xs text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-semibold block mb-0.5">Existing Cluster Match Detected:</span>
              {mappedClusterMatches.map((m) => (
                <span key={m.cluster_id} className="block text-[11px] font-mono">
                  Cluster #{m.cluster_id} ({m.canonical_display_id}) already contains one or more aliases.
                  If consensus validates SAME_VULNERABILITY, this proposal will extend cluster #{m.cluster_id}.
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Client Nonce (Idempotency Key) */}
        <div className="pt-2 border-t border-gray-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
              Client Nonce (Idempotency Key)
            </label>
            <button
              type="button"
              onClick={() => setClientNonce(generateNonce())}
              className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-mono"
            >
              <RefreshCw className="w-3 h-3" /> Regenerate
            </button>
          </div>
          <input
            type="text"
            value={clientNonce}
            onChange={(e) => setClientNonce(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-[11px] font-mono text-gray-400 focus:outline-none focus:border-blue-500"
          />
          <p className="text-[10px] text-gray-500 font-mono">
            Guarantees idempotent submission per caller. Re-submitting with same nonce returns existing proposal.
          </p>
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center justify-between gap-4">
          <div className="text-[11px] text-gray-500">
            {!isConnected && (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Wallet required to propose
              </span>
            )}
          </div>
          {isConnected ? (
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-blue-500/10 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Propose Alias Pair
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={openWalletModal}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md transition"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet to Propose</span>
            </button>
          )}
        </div>
      </form>

      {/* Success Callout */}
      {submittedId && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex items-center justify-between animate-in fade-in">
          <div>
            <h4 className="text-sm font-semibold text-emerald-400">Proposal #{submittedId} Registered</h4>
            <p className="text-xs text-gray-300 mt-0.5">
              The alias set is in PROPOSED status and ready for multi-source consensus assessment.
            </p>
          </div>
          <button
            onClick={() => onSuccessNavigate(submittedId)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-md"
          >
            <span>Assess Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
