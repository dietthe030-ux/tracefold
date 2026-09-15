import { PendingOperation } from '../types';

const STORAGE_KEY = 'tracefold_pending_operations_v1';

export class PendingTxStore {
  public static getAll(): PendingOperation[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public static getPending(): PendingOperation[] {
    return this.getAll().filter((op) => op.status === 'SIGNING' || op.status === 'PENDING' || op.status === 'RECONCILING');
  }

  public static saveIntent(op: PendingOperation): void {
    if (typeof window === 'undefined' || !window.localStorage) throw new Error('Pending transaction storage unavailable');
    try {
      const ops = this.getAll().filter((item) => item.id !== op.id);
      ops.push(op);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
    } catch (error) {
      throw new Error(`Could not persist transaction intent: ${String(error)}`);
    }
  }

  public static updateHash(id: string, hash: string): void {
    if (typeof window === 'undefined' || !window.localStorage) throw new Error('Pending transaction storage unavailable');
    try {
      const ops = this.getAll().map((item) => {
        if (item.id === id) {
          return {
            ...item,
            hash,
            status: 'PENDING' as const,
            submittedAt: Date.now(),
          };
        }
        return item;
      });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
    } catch (error) {
      throw new Error(`Could not persist transaction hash: ${String(error)}`);
    }
  }

  public static updateStatus(
    id: string,
    status: PendingOperation['status'],
    error?: string
  ): void {
    if (typeof window === 'undefined' || !window.localStorage) throw new Error('Pending transaction storage unavailable');
    try {
      const ops = this.getAll().map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status,
            error: error || item.error,
          };
        }
        return item;
      });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
    } catch (error) {
      throw new Error(`Could not persist transaction status: ${String(error)}`);
    }
  }

  public static remove(id: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const ops = this.getAll().filter((item) => item.id !== id);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
    } catch {
      // Ignore storage errors
    }
  }

  public static clearCompleted(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const ops = this.getAll().filter(
        (item) => item.status === 'SIGNING' || item.status === 'PENDING' || item.status === 'RECONCILING'
      );
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
    } catch {
      // Ignore storage errors
    }
  }
}
