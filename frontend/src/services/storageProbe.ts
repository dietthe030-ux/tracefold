/**
 * Storage Capability Prober
 * Verifies that the client runtime supports reliable synchronous persistence
 * before any write operations or transaction intents are initiated.
 */

const PROBE_KEY = '__tracefold_storage_capability_probe__';

export interface StorageProbeResult {
  ok: boolean;
  error?: string;
}

export function probeStorageCapability(): StorageProbeResult {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      ok: false,
      error: 'Browser localStorage is not available in current environment.',
    };
  }

  try {
    const testPayload = `probe_${Date.now()}_${Math.random()}`;
    window.localStorage.setItem(PROBE_KEY, testPayload);
    const readback = window.localStorage.getItem(PROBE_KEY);
    window.localStorage.removeItem(PROBE_KEY);

    if (readback !== testPayload) {
      return {
        ok: false,
        error: 'Storage readback mismatch: persistence layer is corrupted or intercepted.',
      };
    }

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown storage exception';
    return {
      ok: false,
      error: `Storage capability probe failed (quota exceeded or storage blocked): ${message}`,
    };
  }
}
