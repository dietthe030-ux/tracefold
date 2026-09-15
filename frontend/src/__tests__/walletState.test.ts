import { describe, expect, it, vi } from 'vitest';
import { initialWalletState, walletReducer } from '../context/WalletContext';
import { EIP6963ProviderDetail, STUDIO_DEVNET_CHAIN_ID_HEX } from '../types';

const provider = { request: vi.fn() };
const detail: EIP6963ProviderDetail = { info: { uuid: 'mm', name: 'Untrusted label', icon: 'data:', rdns: 'io.metamask' }, provider };
const account = `0x${'1'.repeat(40)}`;

describe('canonical wallet reducer', () => {
  it('commits provider, account, chain and write binding atomically', () => {
    const state = walletReducer(initialWalletState, { type: 'CONNECTED', account, chainId: STUDIO_DEVNET_CHAIN_ID_HEX, provider: detail });
    expect(state).toMatchObject({ phase: 'CONNECTED', account, selectedProvider: detail, writeProvider: provider, error: null });
  });

  it('disables the write binding on wrong chain and restores it on recovery', () => {
    const connected = walletReducer(initialWalletState, { type: 'CONNECTED', account, chainId: STUDIO_DEVNET_CHAIN_ID_HEX, provider: detail });
    const wrong = walletReducer(connected, { type: 'CHAIN_CHANGED', chainId: '0x1' });
    expect(wrong.phase).toBe('WRONG_CHAIN'); expect(wrong.writeProvider).toBeNull();
    const restored = walletReducer(wrong, { type: 'CHAIN_CHANGED', chainId: STUDIO_DEVNET_CHAIN_ID_HEX });
    expect(restored.phase).toBe('CONNECTED'); expect(restored.writeProvider).toBe(provider);
  });

  it('disconnect clears session truth while preserving discovery', () => {
    const discovered = walletReducer(initialWalletState, { type: 'DISCOVER', providers: [detail] });
    const connected = walletReducer(discovered, { type: 'CONNECTED', account, chainId: STUDIO_DEVNET_CHAIN_ID_HEX, provider: detail });
    const state = walletReducer(connected, { type: 'DISCONNECT' });
    expect(state.phase).toBe('DISCONNECTED'); expect(state.account).toBeNull(); expect(state.selectedProvider).toBeNull(); expect(state.writeProvider).toBeNull(); expect(state.discoveredProviders).toEqual([detail]);
  });
});
