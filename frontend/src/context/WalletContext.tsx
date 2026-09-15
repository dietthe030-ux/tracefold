import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, ReactNode } from 'react';
import { EIP1193Provider, EIP6963ProviderDetail, SUPPORTED_RDNS, STUDIO_DEVNET_CHAIN_ID_HEX } from '../types';
import { eip6963Service, switchOrAddStudioDevChain } from '../services/eip6963';

export type WalletPhase = 'DISCONNECTED' | 'DISCOVERING' | 'CHOOSER_OPEN' | 'CONNECTING' | 'CONNECTED' | 'WRONG_CHAIN' | 'ERROR';
export interface WalletState { phase: WalletPhase; account: string | null; chainId: string | null; selectedProvider: EIP6963ProviderDetail | null; writeProvider: EIP1193Provider | null; discoveredProviders: EIP6963ProviderDetail[]; error: string | null; }
export type WalletAction = { type: 'DISCOVER'; providers: EIP6963ProviderDetail[] } | { type: 'OPEN_CHOOSER' } | { type: 'CLOSE_CHOOSER' } | { type: 'CONNECT_START' } | { type: 'CONNECTED'; account: string; chainId: string; provider: EIP6963ProviderDetail } | { type: 'ACCOUNT_CHANGED'; account: string } | { type: 'CHAIN_CHANGED'; chainId: string } | { type: 'ERROR'; message: string } | { type: 'DISCONNECT' };
export const initialWalletState: WalletState = { phase: 'DISCOVERING', account: null, chainId: null, selectedProvider: null, writeProvider: null, discoveredProviders: [], error: null };
const correctChain = (chainId: string | null) => chainId?.toLowerCase() === STUDIO_DEVNET_CHAIN_ID_HEX.toLowerCase();

export function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'DISCOVER': return { ...state, discoveredProviders: action.providers, phase: state.account ? state.phase : state.phase === 'CHOOSER_OPEN' ? 'CHOOSER_OPEN' : 'DISCONNECTED' };
    case 'OPEN_CHOOSER': return { ...state, phase: 'CHOOSER_OPEN', error: null };
    case 'CLOSE_CHOOSER': return { ...state, phase: state.account ? (correctChain(state.chainId) ? 'CONNECTED' : 'WRONG_CHAIN') : 'DISCONNECTED' };
    case 'CONNECT_START': return { ...state, phase: 'CONNECTING', writeProvider: null, error: null };
    case 'CONNECTED': return { ...state, account: action.account, chainId: action.chainId, selectedProvider: action.provider, writeProvider: correctChain(action.chainId) ? action.provider.provider : null, phase: correctChain(action.chainId) ? 'CONNECTED' : 'WRONG_CHAIN', error: null };
    case 'ACCOUNT_CHANGED': return { ...state, account: action.account, writeProvider: state.phase === 'CONNECTED' ? state.selectedProvider?.provider ?? null : null };
    case 'CHAIN_CHANGED': return { ...state, chainId: action.chainId, writeProvider: correctChain(action.chainId) ? state.selectedProvider?.provider ?? null : null, phase: correctChain(action.chainId) ? 'CONNECTED' : 'WRONG_CHAIN' };
    case 'ERROR': return { ...state, phase: 'ERROR', writeProvider: null, error: action.message };
    case 'DISCONNECT': return { ...initialWalletState, phase: 'DISCONNECTED', discoveredProviders: state.discoveredProviders };
  }
}

interface WalletContextType extends WalletState { isConnected: boolean; isConnecting: boolean; isCorrectNetwork: boolean; isWalletModalOpen: boolean; walletName: string | null; openWalletModal: () => void; closeWalletModal: () => void; connect: (providerDetail: EIP6963ProviderDetail) => Promise<void>; disconnect: () => void; switchNetwork: () => Promise<void>; }
const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialWalletState);
  const activeProviderRef = useRef<EIP6963ProviderDetail | null>(null);
  const accountsListenerRef = useRef<((accounts: unknown) => void) | null>(null);
  const chainListenerRef = useRef<((chainId: unknown) => void) | null>(null);
  const removeProviderListeners = useCallback(() => {
    const provider = activeProviderRef.current?.provider;
    if (provider && typeof provider.removeListener === 'function') {
      if (accountsListenerRef.current) provider.removeListener('accountsChanged', accountsListenerRef.current);
      if (chainListenerRef.current) provider.removeListener('chainChanged', chainListenerRef.current);
    }
    accountsListenerRef.current = null; chainListenerRef.current = null;
  }, []);
  const disconnect = useCallback(() => { removeProviderListeners(); activeProviderRef.current = null; dispatch({ type: 'DISCONNECT' }); }, [removeProviderListeners]);
  useEffect(() => {
    const cleanup = eip6963Service.init();
    const unsubscribe = eip6963Service.subscribe((providers) => dispatch({ type: 'DISCOVER', providers }));
    return () => { unsubscribe(); cleanup(); removeProviderListeners(); };
  }, [removeProviderListeners]);

  const connect = async (detail: EIP6963ProviderDetail) => {
    if (!Object.values(SUPPORTED_RDNS).includes(detail.info.rdns as typeof SUPPORTED_RDNS[keyof typeof SUPPORTED_RDNS])) throw new Error('This wallet is not supported');
    dispatch({ type: 'CONNECT_START' });
    try {
      removeProviderListeners();
      const accounts = await detail.provider.request({ method: 'eth_requestAccounts' }) as string[];
      if (!/^0x[0-9a-fA-F]{40}$/.test(accounts?.[0] ?? '')) throw new Error('The wallet did not return a valid account');
      let chainId = await detail.provider.request({ method: 'eth_chainId' }) as string;
      if (!correctChain(chainId)) try { await switchOrAddStudioDevChain(detail.provider); chainId = await detail.provider.request({ method: 'eth_chainId' }) as string; } catch { /* keep the connection and expose WRONG_CHAIN */ }
      activeProviderRef.current = detail;
      const onAccountsChanged = (value: unknown) => { const next = value as string[]; if (/^0x[0-9a-fA-F]{40}$/.test(next?.[0] ?? '')) dispatch({ type: 'ACCOUNT_CHANGED', account: next[0] }); else disconnect(); };
      const onChainChanged = (value: unknown) => dispatch({ type: 'CHAIN_CHANGED', chainId: String(value) });
      accountsListenerRef.current = onAccountsChanged; chainListenerRef.current = onChainChanged;
      detail.provider.on?.('accountsChanged', onAccountsChanged); detail.provider.on?.('chainChanged', onChainChanged);
      dispatch({ type: 'CONNECTED', account: accounts[0], chainId, provider: detail });
    } catch (error) {
      dispatch({ type: 'ERROR', message: error instanceof Error ? error.message : 'Wallet connection failed' });
      throw error;
    }
  };
  const switchNetwork = async () => {
    const provider = state.selectedProvider?.provider;
    if (!provider) throw new Error('Connect a wallet first');
    try { await switchOrAddStudioDevChain(provider); dispatch({ type: 'CHAIN_CHANGED', chainId: await provider.request({ method: 'eth_chainId' }) as string }); }
    catch (error) { dispatch({ type: 'ERROR', message: error instanceof Error ? error.message : 'Network switch failed' }); throw error; }
  };
  const walletName = state.selectedProvider ? (state.selectedProvider.info.rdns === SUPPORTED_RDNS.METAMASK ? 'MetaMask' : state.selectedProvider.info.rdns === SUPPORTED_RDNS.OKX ? 'OKX Wallet' : 'Rabby') : null;
  const value = useMemo<WalletContextType>(() => ({ ...state, isConnected: state.phase === 'CONNECTED', isConnecting: state.phase === 'CONNECTING', isCorrectNetwork: correctChain(state.chainId), isWalletModalOpen: state.phase === 'CHOOSER_OPEN' || state.phase === 'CONNECTING' || (state.phase === 'ERROR' && !state.account), walletName, openWalletModal: () => dispatch({ type: 'OPEN_CHOOSER' }), closeWalletModal: () => dispatch({ type: 'CLOSE_CHOOSER' }), connect, disconnect, switchNetwork }), [state, disconnect, walletName]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
export const useWallet = () => { const context = useContext(WalletContext); if (!context) throw new Error('useWallet must be used within a WalletProvider'); return context; };
