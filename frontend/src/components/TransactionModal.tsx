import React, { useEffect, useState } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { RefreshCw, CheckCircle2, AlertTriangle, Copy, X } from 'lucide-react';
import { TransactionState } from '../types';

const PENDING = new Set<TransactionState>(['WAITING_FOR_WALLET', 'SUBMITTED', 'WAITING_FOR_FINALITY', 'VERIFYING_EXECUTION', 'VERIFYING_READBACK']);
const COPY: Record<TransactionState, { title: string; detail: string }> = {
  IDLE: { title: 'Ready', detail: 'No transaction is in progress.' },
  WAITING_FOR_WALLET: { title: 'Confirm in your wallet', detail: 'Review the fee and transaction request in your wallet.' },
  SUBMITTED: { title: 'Transaction submitted', detail: 'Your wallet returned a transaction hash.' },
  WAITING_FOR_FINALITY: { title: 'Waiting for finality', detail: 'The network is reaching consensus.' },
  VERIFYING_EXECUTION: { title: 'Verifying execution', detail: 'Finality was reached; semantic execution is being checked.' },
  VERIFYING_READBACK: { title: 'Verifying contract state', detail: 'The finalized consequence is being read from Tracefold.' },
  SUCCESS: { title: 'Transaction complete', detail: 'Finality, execution, and authoritative readback all passed.' },
  REJECTED: { title: 'Request rejected', detail: 'No transaction was confirmed. Review the form before trying again.' },
  FAILED: { title: 'Transaction failed', detail: 'The finalized transaction did not complete successfully.' },
  RECONCILIATION_REQUIRED: { title: 'Verification interrupted', detail: 'Do not submit again. Continue checking this transaction by its existing hash.' },
};

export const TransactionModal: React.FC = () => {
  const { activeTx, dismissActiveTx } = useRegistry();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (activeTx?.state !== 'SUCCESS') return;
    const timer = window.setTimeout(dismissActiveTx, 8000);
    return () => window.clearTimeout(timer);
  }, [activeTx?.state, activeTx?.hash, dismissActiveTx]);
  if (!activeTx || activeTx.state === 'IDLE') return null;
  const pending = PENDING.has(activeTx.state);
  const alert = activeTx.state === 'FAILED' || activeTx.state === 'REJECTED';
  const dismissible = activeTx.state === 'SUCCESS' || alert;
  const copy = activeTx.state === 'FAILED' && !activeTx.hash
    ? { title: 'Transaction not sent', detail: 'Validation or simulation rejected this request before wallet signing.' }
    : COPY[activeTx.state];
  return (
    <section className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-300" data-transaction-phase={activeTx.state} role={alert ? 'alert' : 'status'} aria-live={alert ? 'assertive' : 'polite'} aria-atomic="true">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl w-80 sm:w-96 text-xs space-y-3">
        <div className="flex items-start justify-between border-b border-gray-800 pb-2 gap-3">
          <div className="flex items-start gap-2">
            {pending && <RefreshCw className="w-4 h-4 mt-0.5 animate-spin text-blue-400 shrink-0" aria-hidden="true" />}
            {activeTx.state === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />}
            {(alert || activeTx.state === 'RECONCILIATION_REQUIRED') && <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />}
            <div><strong className="text-white">{copy.title}</strong><p className="text-gray-400 text-[11px] mt-1 leading-relaxed">{activeTx.description || copy.detail}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-600 font-mono">{activeTx.method}</span>
            {dismissible && <button type="button" aria-label="Close transaction status" title="Close" className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={dismissActiveTx}><X className="w-4 h-4"/></button>}
          </div>
        </div>
        {activeTx.hash && <div className="p-2.5 bg-gray-950 rounded border border-gray-800 text-[10px] text-gray-400"><span className="text-gray-600 block uppercase tracking-wider">Transaction hash</span><code className="block break-all my-1.5">{activeTx.hash}</code><button type="button" className="flex items-center gap-1 text-blue-400" onClick={async()=>{await navigator.clipboard.writeText(activeTx.hash!);setCopied(true)}}><Copy className="w-3 h-3"/>{copied?'Copied':'Copy hash'}</button></div>}
        {activeTx.error && <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-[11px] text-red-300">{activeTx.error}</div>}
        {activeTx.state === 'RECONCILIATION_REQUIRED' && <button type="button" className="w-full rounded-lg border border-amber-500/30 p-2 text-amber-300 hover:bg-amber-500/10" onClick={()=>window.location.reload()}>Continue verification</button>}
      </div>
    </section>
  );
};
