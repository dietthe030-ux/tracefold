import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WalletModal } from '../components/WalletModal';
import { WalletProvider } from '../context/WalletContext';

describe('WalletModal Component & EIP-6963 Gate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <WalletProvider>
        <WalletModal isOpen={false} onClose={vi.fn()} />
      </WalletProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders modal with title and empty wallet guidance when no provider announced', () => {
    render(
      <WalletProvider>
        <WalletModal isOpen={true} onClose={vi.fn()} />
      </WalletProvider>
    );

    expect(screen.getByText('Connect Web3 Wallet')).toBeInTheDocument();
    expect(screen.getByText('No supported wallet was detected.')).toBeInTheDocument();
    expect(screen.getByText('MetaMask')).toBeInTheDocument();
    expect(screen.getByText('OKX')).toBeInTheDocument();
    expect(screen.getByText('Rabby')).toBeInTheDocument();
    expect(screen.queryByText('Supported Web3 Wallets (MetaMask, OKX, Rabby)')).not.toBeInTheDocument();
  });

  it('renders the branded OKX logo instead of the injected generic icon', async () => {
    render(
      <WalletProvider>
        <WalletModal isOpen={true} onClose={vi.fn()} />
      </WalletProvider>
    );

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', {
          detail: {
            info: { uuid: 'okx-logo-test', name: 'OKX Wallet', icon: 'data:image/svg+xml,generic', rdns: 'com.okx.wallet' },
            provider: { request: async () => [] },
          },
        })
      );
    });

    expect(screen.getByLabelText('OKX Wallet logo')).toBeInTheDocument();
  });

  it('closes modal upon pressing Escape key', async () => {
    const onClose = vi.fn();
    render(
      <WalletProvider>
        <WalletModal isOpen={true} onClose={onClose} />
      </WalletProvider>
    );

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('does NOT request eth_accounts or eth_requestAccounts upon opening or closing', () => {
    const requestSpy = vi.fn();
    const fakeProvider = { request: requestSpy };

    // Announce MetaMask
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: { uuid: 'mm-test', name: 'MetaMask', icon: '', rdns: 'io.metamask' },
          provider: fakeProvider,
        },
      })
    );

    const onClose = vi.fn();
    render(
      <WalletProvider>
        <WalletModal isOpen={true} onClose={onClose} />
      </WalletProvider>
    );

    // Closing the modal
    const closeBtn = screen.getByLabelText(/Close wallet selection/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();

    // Zero account requests should have been made
    expect(requestSpy).not.toHaveBeenCalled();
  });
});
