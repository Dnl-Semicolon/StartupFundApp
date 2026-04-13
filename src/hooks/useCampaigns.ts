import { useEffect, useState } from 'react';
import { formatEther } from 'ethers';
import { getCampaignManager } from '@/lib/contracts';
import { Campaign, CAMPAIGN_STATUS } from '@/lib/index';

// Maps CampaignManager uint8 status → frontend string
const STATUS_MAP: Record<number, Campaign['status']> = {
  0: CAMPAIGN_STATUS.ACTIVE,
  1: CAMPAIGN_STATUS.FUNDED,
  2: CAMPAIGN_STATUS.CANCELLED,
};

// Builds a minimal User from a wallet address
function addrToUser(address: string): Campaign['creator'] {
  return {
    id: address,
    walletAddress: address,
    name: `${address.slice(0, 6)}…${address.slice(-4)}`,
    role: 'entrepreneur',
    joinedAt: '',
  };
}

export interface UseCampaignsResult {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCampaigns(): UseCampaignsResult {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick(t => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const cm = await getCampaignManager();
        const count = Number(await cm.campaignCount());

        const fetched: Campaign[] = [];

        for (let i = 0; i < count; i++) {
          const [meta, stats, desc] = await Promise.all([
            cm.getCampaignMeta(i),
            cm.getCampaignStats(i),
            cm.getCampaignDescription(i),
          ]);

          fetched.push({
            id: i.toString(),
            creatorId: meta.creator as string,
            creator: addrToUser(meta.creator as string),
            title: meta.title as string,
            slug: meta.slug as string,
            description: desc as string,
            shortDescription: meta.shortDescription as string,
            goalAmount: parseFloat(formatEther(stats.goalAmount as bigint)),
            raisedAmount: parseFloat(formatEther(stats.raisedAmount as bigint)),
            imageUrl: meta.imageUrl as string,
            category: meta.category as Campaign['category'],
            status: STATUS_MAP[Number(stats.status)] ?? CAMPAIGN_STATUS.ACTIVE,
            deadline: new Date(Number(stats.deadline) * 1000).toISOString(),
            createdAt: '',
            updatedAt: '',
            backersCount: Number(stats.backersCount),
            milestones: [],
            tokenRewardSymbol: stats.tokenSymbol as string,
            minContribution: parseFloat(formatEther(stats.minContribution as bigint)),
          });
        }

        if (!cancelled) setCampaigns(fetched);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load campaigns');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [tick]);

  return { campaigns, loading, error, refetch };
}
