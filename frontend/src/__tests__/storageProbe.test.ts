import { describe, it, expect, beforeEach, vi } from 'vitest';
import { probeStorageCapability } from '../services/storageProbe';

describe('Storage Capability Probe Service', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('verifies round-trip read/write/delete capability for localStorage', () => {
    const probe = probeStorageCapability();
    expect(probe.ok).toBe(true);
    expect(probe.error).toBeUndefined();

    // Probe key should be cleaned up immediately
    expect(localStorage.getItem('__tracefold_storage_capability_probe__')).toBeNull();
  });

  it('detects quota or security access errors when storage throws', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError: storage limit reached');
    });

    const probe = probeStorageCapability();
    expect(probe.ok).toBe(false);
    expect(probe.error).toContain('QuotaExceededError');

    setItemSpy.mockRestore();
  });

  it('fails if readback validation value does not match probe value', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('corrupted_probe_value');

    const probe = probeStorageCapability();
    expect(probe.ok).toBe(false);
    expect(probe.error).toContain('Storage readback mismatch');

    getItemSpy.mockRestore();
  });
});
