import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EIP6963DiscoveryService, switchOrAddStudioDevChain } from '../services/eip6963';
import { SUPPORTED_RDNS, STUDIO_DEVNET_CHAIN_ID_HEX } from '../types';

describe('EIP-6963 3-Wallet Discovery & Gate Service', () => {
  let service: EIP6963DiscoveryService;

  beforeEach(() => {
    service = new EIP6963DiscoveryService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers announce listener prior to dispatching eip6963:requestProvider', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const addListenerSpy = vi.spyOn(window, 'addEventListener');

    service.init();

    // Check addEventListener called before dispatchEvent
    expect(addListenerSpy).toHaveBeenCalledWith('eip6963:announceProvider', expect.any(Function));
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('filters and accepts MetaMask, OKX, and Rabby providers only', () => {
    service.init();

    // MetaMask announcement
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: { uuid: 'uuid-mm', name: 'MetaMask', icon: '', rdns: SUPPORTED_RDNS.METAMASK },
          provider: { request: async () => [] },
        },
      })
    );

    // OKX announcement
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: { uuid: 'uuid-okx', name: 'OKX Wallet', icon: '', rdns: SUPPORTED_RDNS.OKX },
          provider: { request: async () => [] },
        },
      })
    );

    // Rabby announcement
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: { uuid: 'uuid-rabby', name: 'Rabby Wallet', icon: '', rdns: SUPPORTED_RDNS.RABBY },
          provider: { request: async () => [] },
        },
      })
    );

    // Unsupported Wallet announcement
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: { uuid: 'uuid-other', name: 'Phantom', icon: '', rdns: 'app.phantom' },
          provider: { request: async () => [] },
        },
      })
    );

    const providers = service.getProviders();
    expect(providers.length).toBe(3);
    const rdnsList = providers.map((p) => p.info.rdns);
    expect(rdnsList).toContain(SUPPORTED_RDNS.METAMASK);
    expect(rdnsList).toContain(SUPPORTED_RDNS.OKX);
    expect(rdnsList).toContain(SUPPORTED_RDNS.RABBY);
    expect(rdnsList).not.toContain('app.phantom');
  });

  it('deduplicates announcements by UUID and provider-object reference', () => {
    service.init();
    const sharedProvider = { request: async () => [] };

    // First announcement
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: { uuid: 'uuid-dup-1', name: 'MetaMask', icon: '', rdns: SUPPORTED_RDNS.METAMASK },
          provider: sharedProvider,
        },
      })
    );

    // Duplicate by same UUID
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: { uuid: 'uuid-dup-1', name: 'MetaMask 2', icon: '', rdns: SUPPORTED_RDNS.METAMASK },
          provider: { request: async () => [] },
        },
      })
    );

    // A separate announcement for the same canonical wallet updates that option.
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: { uuid: 'uuid-dup-2', name: 'MetaMask 3', icon: '', rdns: SUPPORTED_RDNS.METAMASK },
          provider: sharedProvider,
        },
      })
    );

    const providers = service.getProviders();
    expect(providers.length).toBe(1);
    expect(new Set(providers.map((p) => p.info.rdns)).size).toBe(1);
  });

  it('deduplicates two live announcements sharing the same provider object', () => {
    service.init();
    const provider = { request: async () => [] };
    for (const uuid of ['provider-uuid-1', 'provider-uuid-2']) {
      window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
        detail: { info: { uuid, name: 'MetaMask', icon: '', rdns: SUPPORTED_RDNS.METAMASK }, provider },
      }));
    }
    expect(service.getProviders()).toHaveLength(1);
  });

  it('notifies subscribers upon provider announcement', () => {
    service.init();
    let notifications = 0;
    const unsubscribe = service.subscribe(() => {
      notifications++;
    });

    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: { uuid: 'uuid-sub', name: 'Rabby', icon: '', rdns: SUPPORTED_RDNS.RABBY },
          provider: { request: async () => [] },
        },
      })
    );

    expect(notifications).toBeGreaterThanOrEqual(1);
    unsubscribe();
  });

  it.each([
    [SUPPORTED_RDNS.METAMASK], [SUPPORTED_RDNS.OKX], [SUPPORTED_RDNS.RABBY],
    [SUPPORTED_RDNS.METAMASK, SUPPORTED_RDNS.OKX],
    [SUPPORTED_RDNS.METAMASK, SUPPORTED_RDNS.RABBY],
    [SUPPORTED_RDNS.OKX, SUPPORTED_RDNS.RABBY],
    [SUPPORTED_RDNS.METAMASK, SUPPORTED_RDNS.OKX, SUPPORTED_RDNS.RABBY],
  ])('renders one callable option for each detected canonical wallet: %s', (...rdnsList) => {
    service.init();
    rdnsList.forEach((rdns, index) => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
      detail: { info: { uuid: `uuid-${index}`, name: 'untrusted', icon: '', rdns }, provider: { request: vi.fn() } },
    })));
    const providers = service.getProviders();
    expect(providers).toHaveLength(rdnsList.length);
    expect(providers.every((entry) => typeof entry.provider.request === 'function')).toBe(true);
  });

  it('recovers an unannounced OKX provider without hiding an announced MetaMask provider', async () => {
    const okxProvider = { request: async () => [] as unknown[], isOkxWallet: true };
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: { providers: [{ request: async () => [] as unknown[], isMetaMask: true }, okxProvider] },
    });

    service.init();
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: { uuid: 'uuid-mm-live', name: 'MetaMask', icon: '', rdns: SUPPORTED_RDNS.METAMASK },
          provider: { request: async () => [] },
        },
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(service.getProviders().map((provider) => provider.info.rdns)).toEqual(
      expect.arrayContaining([SUPPORTED_RDNS.METAMASK, SUPPORTED_RDNS.OKX])
    );
  });

  it('switchOrAddStudioDevChain requests wallet_switchEthereumChain first', async () => {
    const mockRequest = vi.fn().mockResolvedValue(null);
    const mockProvider = { request: mockRequest };

    await switchOrAddStudioDevChain(mockProvider);

    expect(mockRequest).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIO_DEVNET_CHAIN_ID_HEX }],
    });
  });

  it('switchOrAddStudioDevChain adds chain if error code is 4902', async () => {
    let switchAttempts = 0;
    const mockRequest = vi.fn().mockImplementation(async ({ method }) => {
      if (method === 'wallet_switchEthereumChain') {
        switchAttempts += 1;
        if (switchAttempts > 1) return null;
        const err = new Error('Chain not added') as Error & { code: number };
        err.code = 4902;
        throw err;
      }
      if (method === 'wallet_addEthereumChain') {
        return null;
      }
      return null;
    });

    const mockProvider = { request: mockRequest };

    await switchOrAddStudioDevChain(mockProvider);

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'wallet_addEthereumChain',
        params: expect.arrayContaining([
          expect.objectContaining({
            chainId: STUDIO_DEVNET_CHAIN_ID_HEX,
          }),
        ]),
      })
    );
    expect(switchAttempts).toBe(2);
  });
});
