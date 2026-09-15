export function validateCveId(cveId: string): { valid: boolean; error?: string; normalized: string } {
  if (!cveId || typeof cveId !== 'string') {
    return { valid: false, error: 'CVE ID is required', normalized: '' };
  }
  const s = cveId.trim().toUpperCase();
  if (s.length === 0) {
    return { valid: false, error: 'CVE ID cannot be empty', normalized: '' };
  }
  if (s.length > 32 || !/^CVE-\d{4}-\d{4,8}$/.test(s)) {
    return { valid: false, error: 'Invalid CVE format (expected CVE-YYYY-NNNN...)', normalized: s };
  }
  return { valid: true, normalized: s };
}

export function validateGhsaId(ghsaId: string): { valid: boolean; error?: string; normalized: string } {
  if (!ghsaId || typeof ghsaId !== 'string') {
    return { valid: false, error: 'GHSA ID is required', normalized: '' };
  }
  const s = ghsaId.trim();
  if (s.length === 0) {
    return { valid: false, error: 'GHSA ID cannot be empty', normalized: '' };
  }
  if (s.length > 36 || !/^GHSA(-[2-9a-kmnp-z]{4}){3}$/.test(s)) {
    return { valid: false, error: 'Invalid GHSA format (expected GHSA-xxxx-xxxx-xxxx in base32 lowercase)', normalized: s };
  }
  return { valid: true, normalized: s };
}

export function validateOsvId(osvId: string): { valid: boolean; error?: string; normalized: string } {
  if (!osvId || typeof osvId !== 'string') {
    return { valid: false, error: 'OSV ID is required', normalized: '' };
  }
  const s = osvId.trim();
  if (s.length === 0) {
    return { valid: false, error: 'OSV ID cannot be empty', normalized: '' };
  }
  if (s.length > 64 || !/^[A-Za-z0-9_-]+$/.test(s)) {
    return { valid: false, error: 'Invalid OSV format (alphanumeric, dash, underscore only)', normalized: s };
  }
  return { valid: true, normalized: s };
}

export function validateAlias(alias: string): {
  valid: boolean;
  error?: string;
  type: 'CVE' | 'GHSA' | 'OSV' | 'UNKNOWN';
  normalized: string;
} {
  const trimmed = alias.trim();
  if (trimmed.toUpperCase().startsWith('CVE-')) {
    const res = validateCveId(trimmed);
    return { ...res, type: 'CVE' };
  }
  if (trimmed.startsWith('GHSA-') || trimmed.startsWith('ghsa-')) {
    const res = validateGhsaId(trimmed);
    return { ...res, type: 'GHSA' };
  }
  if (/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    const res = validateOsvId(trimmed);
    return { ...res, type: 'OSV' };
  }
  return { valid: false, error: 'Unrecognized vulnerability identifier format', type: 'UNKNOWN', normalized: trimmed };
}

export function computeCanonicalDisplayId(aliases: string[]): string {
  if (!aliases || aliases.length === 0) return '';
  const cves = aliases.filter(a => a.startsWith('CVE-')).sort();
  if (cves.length > 0) return cves[0];
  const ghsas = aliases.filter(a => a.startsWith('GHSA-')).sort();
  if (ghsas.length > 0) return ghsas[0];
  const osvs = [...aliases].sort();
  return osvs[0] || '';
}

export function generateNonce(): string {
  const randHex = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  const timestamp = Date.now().toString(16);
  return `tracefold-nonce-${timestamp}-${randHex}`;
}

export function shortenAddress(address?: string): string {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDate(isoStr?: string): string {
  if (!isoStr) return 'N/A';
  try {
    const dt = new Date(isoStr);
    if (isNaN(dt.getTime())) return isoStr;
    return dt.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

export function computeRemainingCooldown(lastAssessedAt?: string, cooldownSec = 600): number {
  if (!lastAssessedAt) return 0;
  try {
    const lastTs = Math.floor(new Date(lastAssessedAt).getTime() / 1000);
    const nowTs = Math.floor(Date.now() / 1000);
    const diff = (lastTs + cooldownSec) - nowTs;
    return diff > 0 ? diff : 0;
  } catch {
    return 0;
  }
}
