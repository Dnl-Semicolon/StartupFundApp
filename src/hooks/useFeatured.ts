import { useMemo } from 'react';
import { Campaign, CAMPAIGN_STATUS } from '@/lib/index';

export interface FeaturedData {
  topFunded:           Campaign | null;
  risingFast:          Campaign | null;
  topCreatorAddress:   string | null;
  topCreatorCampaigns: Campaign[];
  categoryTop:         Record<string, Campaign>;
}

/**
 * Derives "featured" campaigns from the current campaign list.
 *
 * Scoring signals:
 *   - topFunded:   highest raisedAmount / goalAmount ratio
 *   - risingFast:  highest velocity (ratio per day since creation). Uses a
 *                  30-day nominal window proxy because on-chain campaigns
 *                  don't store createdAt (only deadline).
 *   - topCreator:  wallet with the most FUNDED campaigns
 *   - categoryTop: best ratio per category
 *
 * All purely derived from data already in memory — no extra contract calls.
 */
export function useFeatured(campaigns: Campaign[]): FeaturedData {
  return useMemo(() => {
    const scoreable = campaigns.filter(
      c => c.status === CAMPAIGN_STATUS.ACTIVE || c.status === CAMPAIGN_STATUS.FUNDED
    );

    // ── topFunded: highest raisedAmount / goalAmount ratio ──
    const topFunded = scoreable.reduce<Campaign | null>((best, c) => {
      if (c.goalAmount === 0) return best;
      const ratio     = c.raisedAmount / c.goalAmount;
      const bestRatio = best && best.goalAmount > 0 ? best.raisedAmount / best.goalAmount : -1;
      return ratio > bestRatio ? c : best;
    }, null);

    // ── risingFast: velocity = ratio / days since "nominal" start ──
    // Without on-chain createdAt, we approximate days elapsed as
    // (30 - daysLeft), clamped to a minimum of 1 day so short-deadline
    // campaigns don't get infinite velocity on day-0.
    const now = Date.now();
    const computeVelocity = (c: Campaign): number => {
      if (c.goalAmount === 0 || c.raisedAmount === 0) return -1;
      const daysLeft    = Math.max(0, (new Date(c.deadline).getTime() - now) / 86_400_000);
      const daysElapsed = Math.max(1, 30 - daysLeft);
      return (c.raisedAmount / c.goalAmount) / daysElapsed;
    };
    const risingFast = scoreable.reduce<Campaign | null>((best, c) => {
      return computeVelocity(c) > (best ? computeVelocity(best) : -1) ? c : best;
    }, null);

    // ── topCreator: wallet with most FUNDED campaigns ──
    const creatorMap: Record<string, Campaign[]> = {};
    for (const c of campaigns) {
      if (c.status !== CAMPAIGN_STATUS.FUNDED) continue;
      creatorMap[c.creatorId] = [...(creatorMap[c.creatorId] ?? []), c];
    }
    const topEntry = Object.entries(creatorMap).sort((a, b) => b[1].length - a[1].length)[0];
    const topCreatorAddress   = topEntry?.[0] ?? null;
    const topCreatorCampaigns = topEntry?.[1] ?? [];

    // ── categoryTop: best ratio per category ──
    const categoryTop: Record<string, Campaign> = {};
    for (const c of scoreable) {
      if (c.goalAmount === 0) continue;
      const ratio   = c.raisedAmount / c.goalAmount;
      const current = categoryTop[c.category];
      const currentRatio = current && current.goalAmount > 0
        ? current.raisedAmount / current.goalAmount
        : -1;
      if (ratio > currentRatio) categoryTop[c.category] = c;
    }

    return { topFunded, risingFast, topCreatorAddress, topCreatorCampaigns, categoryTop };
  }, [campaigns]);
}
