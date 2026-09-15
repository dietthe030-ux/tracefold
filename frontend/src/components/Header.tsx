import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useRegistry } from '../context/RegistryContext';
import { shortenAddress } from '../utils/validation';
import { WalletModal } from './WalletModal';
import { Shield, Wallet, RefreshCw, Copy, Check, Server, AlertCircle } from 'lucide-react';
import { STUDIO_DEVNET_EXPLORER_URL } from '../types';

export const Header: React.FC = () => {
  const { isCorrectNetwork, account, walletName, isWalletModalOpen, openWalletModal, closeWalletModal, disconnect, switchNetwork } = useWallet();
  const hasWalletSession = Boolean(account && walletName);
  const { refreshAll, isLoading, counts, upgraderAddress } = useRegistry();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (upgraderAddress) {
      navigator.clipboard.writeText(upgraderAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight">Tracefold</span>
              <a
                href={STUDIO_DEVNET_EXPLORER_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono rounded hover:underline"
                title="View GenLayer network explorer"
              >
                GenLayer
              </a>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">Evidence-first alias resolution</p>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <div className="px-2.5 py-1 bg-gray-800/80 border border-gray-700/60 rounded-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-gray-400">Clusters:</span>
            <span className="text-white font-bold">{counts.cluster_count}</span>
          </div>
          <div className="px-2.5 py-1 bg-gray-800/80 border border-gray-700/60 rounded-md flex items-center gap-2">
            <span className="text-gray-400">Proposals:</span>
            <span className="text-white font-bold">{counts.proposal_count}</span>
          </div>
          <div className="px-2.5 py-1 bg-gray-800/80 border border-gray-700/60 rounded-md flex items-center gap-2">
            <span className="text-gray-400">Consumed:</span>
            <span className="text-white font-bold">{counts.consumption_count}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Refresh button */}
          <button
            onClick={() => refreshAll()}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition disabled:opacity-50"
            title="Refresh Registry Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* Upgrader quick-copy badge */}
          {upgraderAddress && (
            <div
              onClick={copyAddress}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg cursor-pointer transition text-xs font-mono text-gray-300"
              title="Click to copy contract upgrader address"
            >
              <Server className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px]">{shortenAddress(upgraderAddress)}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-500" />}
            </div>
          )}

          {/* Wrong network warning */}
          {hasWalletSession && !isCorrectNetwork && (
            <button
              onClick={switchNetwork}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-lg hover:bg-amber-500/20 transition"
              title="Switch to the supported GenLayer network"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Switch network</span>
            </button>
          )}

          {/* Wallet Button */}
          {hasWalletSession ? (
            <div className="flex items-center gap-2 bg-gray-800/90 border border-gray-700 px-3 py-1.5 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
              <span className="hidden sm:inline text-xs text-gray-300">{walletName}</span>
              <span className="font-mono text-xs text-gray-200">{shortenAddress(account || '')}</span>
              <button
                onClick={disconnect}
                className="text-[11px] text-gray-400 hover:text-red-400 ml-1 border-l border-gray-700 pl-2 transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={openWalletModal}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-500/10 transition"
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      <WalletModal isOpen={isWalletModalOpen} onClose={closeWalletModal} />
    </header>
  );
};
