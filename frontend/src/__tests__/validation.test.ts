import { describe, it, expect } from 'vitest';
import {
  validateCveId,
  validateGhsaId,
  validateOsvId,
  validateAlias,
  computeCanonicalDisplayId,
  generateNonce,
  shortenAddress,
  computeRemainingCooldown,
} from '../utils/validation';

describe('Validation Utilities', () => {
  describe('validateCveId', () => {
    it('accepts valid CVE identifiers', () => {
      expect(validateCveId('CVE-2024-3094').valid).toBe(true);
      expect(validateCveId('cve-2023-4863').normalized).toBe('CVE-2023-4863');
      expect(validateCveId('CVE-1999-0001').valid).toBe(true);
      expect(validateCveId('CVE-2026-12345678').valid).toBe(true);
    });

    it('rejects invalid CVE identifiers', () => {
      expect(validateCveId('').valid).toBe(false);
      expect(validateCveId('CVE-24-3094').valid).toBe(false);
      expect(validateCveId('CVE-2024-309').valid).toBe(false);
      expect(validateCveId('GHSA-42xw-2xvc-cx4x').valid).toBe(false);
    });
  });

  describe('validateGhsaId', () => {
    it('accepts valid GHSA identifiers in base32 format', () => {
      expect(validateGhsaId('GHSA-42xw-2xvc-cx4x').valid).toBe(true);
      expect(validateGhsaId('GHSA-j7hp-h8jx-5ppr').valid).toBe(true);
      expect(validateGhsaId('GHSA-v2c9-h5x8-8whx').valid).toBe(true);
    });

    it('rejects invalid GHSA identifiers', () => {
      expect(validateGhsaId('').valid).toBe(false);
      expect(validateGhsaId('GHSA-1234').valid).toBe(false);
      expect(validateGhsaId('CVE-2024-3094').valid).toBe(false);
    });
  });

  describe('validateOsvId', () => {
    it('accepts valid OSV identifiers', () => {
      expect(validateOsvId('OSV-XZ-BACKDOOR-2024').valid).toBe(true);
      expect(validateOsvId('PYSEC-2023-100').valid).toBe(true);
      expect(validateOsvId('GO-2022-0965').valid).toBe(true);
    });

    it('rejects invalid OSV identifiers', () => {
      expect(validateOsvId('').valid).toBe(false);
      expect(validateOsvId('Invalid ID with spaces!').valid).toBe(false);
    });
  });

  describe('validateAlias routing', () => {
    it('correctly categorizes CVE, GHSA, and OSV', () => {
      expect(validateAlias('CVE-2024-3094').type).toBe('CVE');
      expect(validateAlias('GHSA-42xw-2xvc-cx4x').type).toBe('GHSA');
      expect(validateAlias('OSV-XZ-2024').type).toBe('OSV');
      expect(validateAlias('invalid@alias').type).toBe('UNKNOWN');
    });
  });

  describe('computeCanonicalDisplayId', () => {
    it('prioritizes CVE over GHSA and OSV', () => {
      const aliases = ['OSV-XZ-BACKDOOR-2024', 'GHSA-42xw-2xvc-cx4x', 'CVE-2024-3094'];
      expect(computeCanonicalDisplayId(aliases)).toBe('CVE-2024-3094');
    });

    it('prioritizes GHSA over OSV if no CVE exists', () => {
      const aliases = ['OSV-XZ-BACKDOOR-2024', 'GHSA-42xw-2xvc-cx4x'];
      expect(computeCanonicalDisplayId(aliases)).toBe('GHSA-42xw-2xvc-cx4x');
    });

    it('picks lowest lexicographical identifier in same tier', () => {
      const aliases = ['CVE-2024-9999', 'CVE-2024-1111'];
      expect(computeCanonicalDisplayId(aliases)).toBe('CVE-2024-1111');
    });

    it('handles empty input gracefully', () => {
      expect(computeCanonicalDisplayId([])).toBe('');
    });
  });

  describe('generateNonce & shortenAddress', () => {
    it('generates nonces starting with prefix', () => {
      const n1 = generateNonce();
      const n2 = generateNonce();
      expect(n1.startsWith('tracefold-nonce-')).toBe(true);
      expect(n1).not.toBe(n2);
    });

    it('shortens 42-char hex addresses correctly', () => {
      expect(shortenAddress('0x71c563964d436cf0ba78ec58be3ef7a8109bf1f2')).toBe('0x71c5...f1f2');
      expect(shortenAddress('')).toBe('');
      expect(shortenAddress('0x1234')).toBe('0x1234');
    });
  });

  describe('computeRemainingCooldown', () => {
    it('returns positive remaining seconds within window', () => {
      const recent = new Date(Date.now() - 300 * 1000).toISOString(); // 5 min ago
      const remaining = computeRemainingCooldown(recent, 600);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(305);
    });

    it('returns 0 when cooldown has elapsed', () => {
      const old = new Date(Date.now() - 700 * 1000).toISOString(); // >10 min ago
      expect(computeRemainingCooldown(old, 600)).toBe(0);
    });
  });
});
