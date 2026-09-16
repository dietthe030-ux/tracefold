import React, { useEffect, useRef, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { EIP6963ProviderDetail, SUPPORTED_RDNS } from '../types';
import { X, ShieldCheck, ExternalLink, AlertTriangle } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletIcon: React.FC<{ provider: EIP6963ProviderDetail }> = ({ provider }) => {
  if (provider.info.rdns === SUPPORTED_RDNS.OKX) {
    return (
      <svg
        className="w-7 h-7 rounded-md"
        viewBox="0 0 28 28"
        role="img"
        aria-label="OKX Wallet logo"
      >
        <rect width="28" height="28" rx="6" fill="#000" />
        <text x="14" y="17" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">
          OKX
        </text>
      </svg>
    );
  }
  const rabby = provider.info.rdns === SUPPORTED_RDNS.RABBY;
  return (
    <div role="img" aria-label={rabby ? 'Rabby logo' : 'MetaMask logo'} className={`w-7 h-7 rounded-md ${rabby ? 'bg-blue-500' : 'bg-orange-500'} flex items-center justify-center font-bold text-xs text-white`}>
      {rabby ? 'R' : 'M'}
    </div>
  );
};

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { discoveredProviders, connect, isConnecting, error } = useWallet();
  const modalRef = useRef<HTMLDivElement>(null);
  const [connectingProviderUuid, setConnectingProviderUuid] = useState<string | null>(null);

  // Focus trap and Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const obscured = Array.from(document.querySelectorAll<HTMLElement>('.workspace-main, .workspace-intro, .workspace-layer > nav'));
    obscured.forEach((element) => element.setAttribute('inert', ''));
    requestAnimationFrame(() => modalRef.current?.focus());

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
        if (!focusable.length) { e.preventDefault(); return; }
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      obscured.forEach((element) => element.removeAttribute('inert'));
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getWalletDisplayName = (rdns: string, defaultName: string) => {
    if (rdns === SUPPORTED_RDNS.METAMASK) return 'MetaMask';
    if (rdns === SUPPORTED_RDNS.OKX) return 'OKX Wallet';
    if (rdns === SUPPORTED_RDNS.RABBY) return 'Rabby Wallet';
    return defaultName;
  };

  const handleConnect = async (provider: (typeof discoveredProviders)[0]) => {
    setConnectingProviderUuid(provider.info.uuid);
    try {
      await connect(provider);
      onClose();
    } catch {
      // Error handled in context
    } finally {
      setConnectingProviderUuid(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          aria-label="Close wallet selection dialog"
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 id="wallet-modal-title" className="text-xl font-bold text-white">
              Connect Web3 Wallet
            </h2>
            <p className="text-xs text-gray-400">Choose your detected wallet</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2.5 text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 mb-2">
          {discoveredProviders.length === 0 ? (
            <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg text-center">
              <p className="text-sm text-gray-300 mb-2">No supported wallet was detected.</p>
              <p className="text-xs text-gray-500">
                Install a supported browser wallet to use Tracefold actions.
              </p>
              <div className="mt-3 flex justify-center gap-4 text-xs text-blue-400">
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:underline"
                >
                  MetaMask <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://www.okx.com/web3"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:underline"
                >
                  OKX <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://rabby.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:underline"
                >
                  Rabby <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            discoveredProviders.map((prov) => (
              <button
                key={prov.info.uuid}
                onClick={() => handleConnect(prov)}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-3.5 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-blue-500/50 rounded-lg transition group focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex items-center gap-3">
                  <WalletIcon provider={prov} />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition">
                      {getWalletDisplayName(prov.info.rdns, prov.info.name)}
                    </div>
                  </div>
                </div>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded border border-blue-500/20 font-medium">
                  {isConnecting && connectingProviderUuid === prov.info.uuid ? 'Connecting...' : 'Connect'}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
