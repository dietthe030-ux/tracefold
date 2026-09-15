import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import App from '../App';
import { ClusterExplorer } from '../components/ClusterExplorer';
import { ProposeAliasSet } from '../components/ProposeAliasSet';
import { ProposalAssessmentTracker } from '../components/ProposalAssessmentTracker';
import { FileObjection } from '../components/FileObjection';
import { IncidentConsumer } from '../components/IncidentConsumer';
import { WalletProvider } from '../context/WalletContext';
import { RegistryProvider } from '../context/RegistryContext';
import { rpcClient } from '../services/rpcClient';
import { ProposalRecord, ClusterRecord } from '../types';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <WalletProvider>
      <RegistryProvider>{ui}</RegistryProvider>
    </WalletProvider>
  );
};

describe('Frontend Components & User Journeys', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(rpcClient, 'getCounts').mockResolvedValue({
      proposal_count: 0, cluster_count: 0, consumption_count: 0,
      max_proposals: 256, max_clusters: 128, max_aliases_per_cluster: 10,
      max_objections_per_proposal: 8, max_assessments_per_proposal: 3, max_consumptions: 512,
    });
    vi.spyOn(rpcClient, 'getProposals').mockResolvedValue([]);
    vi.spyOn(rpcClient, 'getClusters').mockResolvedValue([]);
    vi.spyOn(rpcClient, 'getUpgrader').mockResolvedValue('');
  });

  it('renders the public layer and enters the operational layer', async () => {
    await act(async () => {
      renderWithProviders(<App />);
    });

    expect(screen.getByRole('heading', { name: /Different records/i })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Open workspace/i })[0]);
    expect(screen.getByText('Cluster Explorer')).toBeInTheDocument();
    expect(screen.getByText('Propose Alias Set')).toBeInTheDocument();
    expect(screen.getByText('Assessment Tracker')).toBeInTheDocument();
    expect(screen.getByText('File Objection')).toBeInTheDocument();
    expect(screen.getByText('Incident Consumer')).toBeInTheDocument();
    expect(screen.getByText('Evidence')).toBeInTheDocument();
  });

  it('J1: Cluster Explorer displays empty state or populated cluster cards', async () => {
    const mockCluster: ClusterRecord = {
      cluster_id: 1,
      canonical_display_id: 'CVE-2024-3094',
      aliases: ['CVE-2024-3094', 'GHSA-42xw-2xvc-cx4x'],
      created_proposal_id: 1,
      merge_fingerprint: 'fp_1234567890abcdef',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    vi.mocked(rpcClient.getClusters).mockResolvedValue([mockCluster]);

    await act(async () => {
      renderWithProviders(<ClusterExplorer onNavigateToPropose={vi.fn()} />);
    });

    expect(screen.getByText('Canonical Vulnerability Clusters')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('CVE-2024-3094').length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(/Search by CVE, GHSA, OSV/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'NONEXISTENT-XYZ-999' } });
    });

    await waitFor(() => {
      expect(screen.getByText('No matching clusters found')).toBeInTheDocument();
    });
  });

  it('J2: Propose Alias Set validates syntax and handles sample pair fill', async () => {
    const onNav = vi.fn();
    await act(async () => {
      renderWithProviders(<ProposeAliasSet onSuccessNavigate={onNav} />);
    });

    expect(screen.getByText('Propose Vulnerability Alias Set')).toBeInTheDocument();

    const sampleBtn = screen.getByText('libwebp Buffer Overflow');
    await act(async () => {
      fireEvent.click(sampleBtn);
    });

    expect(screen.getByDisplayValue('CVE-2023-4863')).toBeInTheDocument();
    expect(screen.getByDisplayValue('GHSA-j7hp-h8jx-5ppr')).toBeInTheDocument();
  });

  it('J3: Proposal Assessment Tracker displays proposals and filters by status', async () => {
    const mockProposals: ProposalRecord[] = [
      {
        proposal_id: 1,
        client_nonce: 'nonce-1',
        canonical_ids: ['CVE-2024-3094', 'GHSA-42xw-2xvc-cx4x'],
        proposer: '0x1111111111111111111111111111111111111111',
        status: 'MERGED',
        attempts: 1,
        objection_count: 0,
        cluster_id: 1,
        created_at: '2026-01-01T00:00:00Z',
        last_assessed_at: '2026-01-01T00:01:00Z',
        latest_assessment: {
          outcome: 'SAME_VULNERABILITY',
          canonical_ids: ['CVE-2024-3094', 'GHSA-42xw-2xvc-cx4x'],
          successful_sources: ['nvd', 'ghsa'],
          source_revisions: { nvd: 'rev1', ghsa: 'rev1' },
          source_statuses: { nvd: 200, ghsa: 200 },
          package_relation: 'EXACT_MATCH',
          range_relation: 'EXACT_MATCH',
          cross_reference_band: 'HIGH',
          root_cause_band: 'HIGH',
          cluster_id: 1,
          fingerprint: 'fp_abc123',
          reason: 'Both sources reference xz-utils backdoor in 5.6.0 and 5.6.1',
          assessed_at: '2026-01-01T00:01:00Z',
        },
      },
      {
        proposal_id: 2,
        client_nonce: 'nonce-2',
        canonical_ids: ['CVE-2023-4863', 'GHSA-j7hp-h8jx-5ppr'],
        proposer: '0x2222222222222222222222222222222222222222',
        status: 'PROPOSED',
        attempts: 0,
        objection_count: 0,
        created_at: '2026-01-01T00:00:00Z',
        last_assessed_at: '',
        latest_assessment: null,
      },
    ];

    vi.mocked(rpcClient.getProposals).mockResolvedValue(mockProposals);

    await act(async () => {
      renderWithProviders(<ProposalAssessmentTracker onNavigateToObjection={vi.fn()} />);
    });

    expect(screen.getByText('Proposal Assessment Tracker')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Proposal #1')).toBeInTheDocument();
      expect(screen.getByText('Proposal #2')).toBeInTheDocument();
    });

    const filterProposed = screen.getByRole('button', { name: 'PROPOSED' });
    await act(async () => {
      fireEvent.click(filterProposed);
    });

    await waitFor(() => {
      expect(screen.getByText('Proposal #2')).toBeInTheDocument();
      expect(screen.queryByText('Proposal #1')).toBeNull();
    });
  });

  it('J4: File Objection renders objection form and validates bounded note', async () => {
    const mockProposals: ProposalRecord[] = [
      {
        proposal_id: 2,
        client_nonce: 'nonce-2',
        canonical_ids: ['CVE-2023-4863', 'GHSA-j7hp-h8jx-5ppr'],
        proposer: '0x2222222222222222222222222222222222222222',
        status: 'PROPOSED',
        attempts: 0,
        objection_count: 0,
        created_at: '2026-01-01T00:00:00Z',
        last_assessed_at: '',
        latest_assessment: null,
      },
    ];

    vi.mocked(rpcClient.getProposals).mockResolvedValue(mockProposals);

    await act(async () => {
      renderWithProviders(<FileObjection />);
    });

    await waitFor(() => {
      expect(screen.getByText('File Formal Objection')).toBeInTheDocument();
    });

    const noteInput = screen.getByPlaceholderText(/State the concrete package discrepancy/i);
    await act(async () => {
      fireEvent.change(noteInput, { target: { value: 'Test objection note on package coordinates.' } });
    });

    expect(screen.getByDisplayValue('Test objection note on package coordinates.')).toBeInTheDocument();
    expect(
      screen.getByText((_content, element) => element?.tagName?.toLowerCase() === 'span' && element?.textContent?.trim() === '43 / 280')
    ).toBeInTheDocument();
  });

  it('J5: Incident Consumer renders exact-once interface and ticket generator', async () => {
    await act(async () => {
      renderWithProviders(<IncidentConsumer />);
    });

    expect(screen.getByText('Downstream Incident Exact-Once Consumer')).toBeInTheDocument();
    expect(screen.getByText('Consume Canonical Cluster')).toBeInTheDocument();

    const newTicketBtn = screen.getByText('New Ticket ID');
    await act(async () => {
      fireEvent.click(newTicketBtn);
    });

    expect(screen.getByPlaceholderText(/INCIDENT-2026-SECOPS/i)).toBeInTheDocument();
  });

});
