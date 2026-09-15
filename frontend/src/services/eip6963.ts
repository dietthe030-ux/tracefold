import {
  EIP1193Provider,
  EIP6963AnnounceProviderEvent,
  EIP6963ProviderDetail,
  SUPPORTED_RDNS,
  STUDIO_DEVNET_CHAIN_ID_HEX,
  STUDIO_DEVNET_RPC_URL,
  STUDIO_DEVNET_EXPLORER_URL,
} from '../types';

const LEGACY_FALLBACK_UUID_PREFIX = 'legacy-injected-ethereum-uuid';

type LegacyInjectedProvider = EIP1193Provider & {
  isMetaMask?: boolean;
  isOkxWallet?: boolean;
  isRabby?: boolean;
};

type InjectedWindow = Window & {
  ethereum?: LegacyInjectedProvider & { providers?: LegacyInjectedProvider[] };
  okxwallet?: LegacyInjectedProvider;
  rabby?: LegacyInjectedProvider;
};

export class EIP6963DiscoveryService {
  private providers = new Map<string, EIP6963ProviderDetail>();
  private listeners = new Set<(providers: EIP6963ProviderDetail[]) => void>();
  private initialized = false;
  private legacyFallbackTimer: ReturnType<typeof setTimeout> | null = null;

  public init(): () => void {
    if (this.initialized) {
      return () => {};
    }
    this.initialized = true;

    const handleAnnouncement = (event: Event) => {
      const announceEvent = event as EIP6963AnnounceProviderEvent;
      if (!announceEvent.detail || !announceEvent.detail.info) return;

      const detail = announceEvent.detail;
      const { rdns, uuid } = detail.info;

      // Filter for strictly supported RDNS only
      if (
        rdns !== SUPPORTED_RDNS.METAMASK &&
        rdns !== SUPPORTED_RDNS.OKX &&
        rdns !== SUPPORTED_RDNS.RABBY
      ) {
        return;
      }

      // Replace a legacy fallback only for the wallet that has now announced via EIP-6963.
      this.removeLegacyFallback(rdns);

      // Deduplicate by UUID and Provider-Object Identity
      const existingEntries = Array.from(this.providers.entries());
      const duplicateKey = existingEntries.find(
        ([key, p]) =>
          key === uuid ||
          p.info.uuid === uuid ||
          p.provider === detail.provider ||
          p.info.rdns === rdns
      );

      if (duplicateKey) {
        this.providers.set(duplicateKey[0], detail);
      } else {
        this.providers.set(uuid, detail);
      }

      this.notify();
    };

    // 1. Register listener BEFORE requesting providers
    if (typeof window !== 'undefined') {
      window.addEventListener('eip6963:announceProvider', handleAnnouncement);

      // 2. Dispatch request event
      window.dispatchEvent(new Event('eip6963:requestProvider'));

      // 3. Bounded fallback for wallets that inject without an EIP-6963 announcement.
      this.legacyFallbackTimer = setTimeout(() => {
        this.addLegacyFallbackProviders();
      }, 50);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('eip6963:announceProvider', handleAnnouncement);
      }
      if (this.legacyFallbackTimer) clearTimeout(this.legacyFallbackTimer);
      this.legacyFallbackTimer = null;
      this.initialized = false;
    };
  }

  public getProviders(): EIP6963ProviderDetail[] {
    return Array.from(this.providers.values());
  }

  public subscribe(callback: (providers: EIP6963ProviderDetail[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getProviders());
    return () => {
      this.listeners.delete(callback);
    };
  }

  public clear(): void {
    if (this.legacyFallbackTimer) clearTimeout(this.legacyFallbackTimer);
    this.legacyFallbackTimer = null;
    this.providers.clear();
  }

  private addLegacyFallbackProviders() {
    if (typeof window === 'undefined') return;

    const injectedWindow = window as InjectedWindow;
    const candidates = [
      ...(injectedWindow.ethereum?.providers ?? []),
      injectedWindow.ethereum,
      injectedWindow.okxwallet,
      injectedWindow.rabby,
    ].filter((provider): provider is LegacyInjectedProvider => Boolean(provider));
    const seenProviders = new Set<EIP1193Provider>();
    let changed = false;

    for (const provider of candidates) {
      if (seenProviders.has(provider)) continue;
      seenProviders.add(provider);

      const rdns = provider.isRabby
        ? SUPPORTED_RDNS.RABBY
        : provider.isOkxWallet
          ? SUPPORTED_RDNS.OKX
          : provider.isMetaMask
            ? SUPPORTED_RDNS.METAMASK
            : null;
      if (!rdns || Array.from(this.providers.values()).some((entry) => entry.info.rdns === rdns)) continue;

      const uuid = `${LEGACY_FALLBACK_UUID_PREFIX}:${rdns}`;
      this.providers.set(uuid, {
        info: {
          uuid,
          name: rdns === SUPPORTED_RDNS.OKX ? 'OKX Wallet' : rdns === SUPPORTED_RDNS.RABBY ? 'Rabby Wallet' : 'MetaMask',
          icon: '',
          rdns,
        },
        provider,
      });
      changed = true;
    }

    if (changed) this.notify();
  }

  private removeLegacyFallback(rdns: string) {
    const uuid = `${LEGACY_FALLBACK_UUID_PREFIX}:${rdns}`;
    if (this.providers.delete(uuid)) this.notify();
  }

  private notify() {
    const list = this.getProviders();
    this.listeners.forEach((listener) => listener(list));
  }
}

export async function switchOrAddStudioDevChain(provider: EIP1193Provider): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIO_DEVNET_CHAIN_ID_HEX }],
    });
  } catch (switchError: unknown) {
    const err = switchError as { code?: number; message?: string };
    // 4902: Unrecognized chain ID in wallet
    if (err.code === 4902 || (err.message && err.message.toLowerCase().includes('unrecognized'))) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: STUDIO_DEVNET_CHAIN_ID_HEX,
            chainName: 'Genlayer Studio Network',
            nativeCurrency: {
              name: 'GEN Token',
              symbol: 'GEN',
              decimals: 18,
            },
            rpcUrls: [STUDIO_DEVNET_RPC_URL],
            blockExplorerUrls: [STUDIO_DEVNET_EXPLORER_URL],
          },
        ],
      });
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: STUDIO_DEVNET_CHAIN_ID_HEX }],
      });
    } else {
      throw switchError;
    }
  }
}

export const eip6963Service = new EIP6963DiscoveryService();
