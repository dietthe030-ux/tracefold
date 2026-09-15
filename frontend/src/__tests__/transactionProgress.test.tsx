import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    useRegistry.mockReturnValue({ activeTx: { state, method: 'assess_proposal', hash: state === 'WAITING_FOR_WALLET' ? undefined : `0x${'1'.repeat(64)}` } });
    const { container, unmount } = render(<TransactionModal />);
    expect(container.querySelector('[data-transaction-phase]')).toHaveAttribute('data-transaction-phase', state);
    expect(screen.getByText(title)).toBeInTheDocument();
    unmount();
  });

  it('hides the indicator in IDLE', () => {
    useRegistry.mockReturnValue({ activeTx: { state: 'IDLE' } });
    const { container } = render(<TransactionModal />);
    expect(container).toBeEmptyDOMElement();
  });
});
