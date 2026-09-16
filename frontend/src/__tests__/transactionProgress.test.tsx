import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { TransactionModal } from '../components/TransactionModal';
import { TransactionState } from '../types';

const useRegistry = vi.fn();
vi.mock('../context/RegistryContext', () => ({ useRegistry: () => useRegistry() }));

const cases: Array<[TransactionState, string]> = [
  ['WAITING_FOR_WALLET', 'Confirm in your wallet'], ['SUBMITTED', 'Transaction submitted'],
  ['WAITING_FOR_FINALITY', 'Waiting for finality'], ['VERIFYING_EXECUTION', 'Verifying execution'],
  ['VERIFYING_READBACK', 'Verifying contract state'], ['SUCCESS', 'Transaction complete'],
  ['REJECTED', 'Request rejected'], ['FAILED', 'Transaction failed'],
  ['RECONCILIATION_REQUIRED', 'Verification interrupted'],
];

describe('public transaction progress', () => {
  it.each(cases)('renders the canonical %s phase', (state, title) => {
    useRegistry.mockReturnValue({ activeTx: { state, method: 'assess_proposal', hash: state === 'WAITING_FOR_WALLET' ? undefined : `0x${'1'.repeat(64)}` }, dismissActiveTx: vi.fn() });
    const { container, unmount } = render(<TransactionModal />);
    expect(container.querySelector('[data-transaction-phase]')).toHaveAttribute('data-transaction-phase', state);
    expect(screen.getByText(title)).toBeInTheDocument();
    unmount();
  });

  it('hides the indicator in IDLE', () => {
    useRegistry.mockReturnValue({ activeTx: { state: 'IDLE' }, dismissActiveTx: vi.fn() });
    const { container } = render(<TransactionModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lets the user close a completed transaction status', () => {
    const dismissActiveTx = vi.fn();
    useRegistry.mockReturnValue({ activeTx: { state: 'SUCCESS', method: 'propose_alias_set', hash: `0x${'2'.repeat(64)}` }, dismissActiveTx });
    render(<TransactionModal />);
    fireEvent.click(screen.getByRole('button', { name: 'Close transaction status' }));
    expect(dismissActiveTx).toHaveBeenCalledOnce();
  });

  it('automatically closes a completed status after eight seconds', () => {
    vi.useFakeTimers();
    const dismissActiveTx = vi.fn();
    useRegistry.mockReturnValue({ activeTx: { state: 'SUCCESS', method: 'propose_alias_set', hash: `0x${'3'.repeat(64)}` }, dismissActiveTx });
    render(<TransactionModal />);
    act(() => vi.advanceTimersByTime(7999));
    expect(dismissActiveTx).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(dismissActiveTx).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('labels a pre-broadcast failure truthfully when no hash exists', () => {
    useRegistry.mockReturnValue({
      activeTx: { state: 'FAILED', method: 'consume_incident', description: 'Validation or fee simulation rejected this request before broadcast. No transaction hash was returned.' },
      dismissActiveTx: vi.fn(),
    });
    render(<TransactionModal />);
    expect(screen.getByText('Transaction not sent')).toBeInTheDocument();
    expect(screen.getByText(/before broadcast/)).toBeInTheDocument();
    expect(screen.queryByText('Transaction hash')).not.toBeInTheDocument();
  });
});
