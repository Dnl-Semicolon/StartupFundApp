// ─────────────────────────────────────────────────────────────────────────────
// demoState — localStorage overlay for hack-mode flows that sit on top of the
// real chain. The chain stays source-of-truth for structure (campaigns +
// contributions exist on-chain) but status transitions we couldn't build
// contract support for in time (voting auto-skip, profit disbursement, refund
// reclaim, sub-1-day deadline hijack) are recorded here and merged into
// useCampaigns reads.
//
// Single-key, versioned blob. One atomic get/set for whole state.
// ─────────────────────────────────────────────────────────────────────────────

import type { CampaignStatus } from '@/lib/index';

const KEY = 'sf_demo_state_v1';

export interface CampaignOverride {
  /** Override the chain-reported status */
  statusOverride?: CampaignStatus;
  /** Override the chain-reported deadline — used by Option Y hijack */
  deadlineOverride?: string; // ISO
  /** Populated when the creator ran "Disburse Profits" */
  disbursedAt?: string;      // ISO
  /** Per-contributor disbursement amount in ETH (address → amount) */
  disbursements?: Record<string, number>;
  /** Creator marked voting skipped (demo fast-forward) */
  votingSkipped?: boolean;
  /** Injected vote tallies for mock campaigns so VotingPanel has screenshot data */
  mockVotes?: { approves: number; disapproves: number };
  /** Contributors reclaimed original funds after creator missed disbursement deadline */
  reclaimed?: Record<string, number>;
}

export interface DemoState {
  version: 1;
  overrides: Record<string, CampaignOverride>;
  /** Standalone contributions recorded by hacked funding paths (off-chain) */
  contributions: Record<string, Array<{ address: string; amount: number; at: string }>>;
}

const EMPTY: DemoState = { version: 1, overrides: {}, contributions: {} };

// ── Core read/write ─────────────────────────────────────────────────────────

export function loadDemoState(): DemoState {
  if (typeof window === 'undefined') return EMPTY;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as DemoState;
    if (parsed.version !== 1) return EMPTY;
    return { ...EMPTY, ...parsed, overrides: parsed.overrides ?? {}, contributions: parsed.contributions ?? {} };
  } catch {
    return EMPTY;
  }
}

export function saveDemoState(state: DemoState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

// ── Convenience mutators ────────────────────────────────────────────────────

export function patchOverride(campaignId: string, patch: Partial<CampaignOverride>): void {
  const s = loadDemoState();
  s.overrides[campaignId] = { ...(s.overrides[campaignId] ?? {}), ...patch };
  saveDemoState(s);
}

export function getOverride(campaignId: string): CampaignOverride | undefined {
  return loadDemoState().overrides[campaignId];
}

export function recordDisbursement(
  campaignId: string,
  payouts: Record<string, number>
): void {
  patchOverride(campaignId, {
    disbursedAt: new Date().toISOString(),
    disbursements: payouts,
    statusOverride: 'funded',
  });
}

export function recordReclaim(
  campaignId: string,
  contributor: string,
  amount: number
): void {
  const s = loadDemoState();
  const over = s.overrides[campaignId] ?? {};
  over.reclaimed = { ...(over.reclaimed ?? {}), [contributor.toLowerCase()]: amount };
  s.overrides[campaignId] = over;
  saveDemoState(s);
}

export function markVotingSkipped(campaignId: string): void {
  patchOverride(campaignId, { votingSkipped: true, statusOverride: 'active' });
}

export function appendContribution(
  campaignId: string,
  address: string,
  amount: number
): void {
  const s = loadDemoState();
  s.contributions[campaignId] = [
    ...(s.contributions[campaignId] ?? []),
    { address: address.toLowerCase(), amount, at: new Date().toISOString() },
  ];
  saveDemoState(s);
}

export function getContributions(
  campaignId: string
): Array<{ address: string; amount: number; at: string }> {
  return loadDemoState().contributions[campaignId] ?? [];
}

// ── Reset (dev / debugging) ─────────────────────────────────────────────────

export function clearDemoState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}
