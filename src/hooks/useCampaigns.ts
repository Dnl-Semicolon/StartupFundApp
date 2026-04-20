import { useEffect, useState, useCallback } from 'react';
import { formatEther } from 'ethers';
import { getCampaignManager } from '@/lib/contracts';
import { Campaign, CAMPAIGN_STATUS } from '@/lib/index';
import { mockCampaigns } from '@/data/index';

// Maps CampaignManager uint8 status → frontend string
const STATUS_MAP: Record<number, Campaign['status']> = {
  0: CAMPAIGN_STATUS.ACTIVE,
  1: CAMPAIGN_STATUS.FUNDED,
  2: CAMPAIGN_STATUS.CANCELLED,
  3: CAMPAIGN_STATUS.FLAGGED,
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
  campaigns:   Campaign[];
  loading:     boolean;
  error:       string | null;
  /** true when contract is unreachable and we are showing demo mock data */
  isMockData:  boolean;
  refetch:     () => void;
}

export function useCampaigns(): UseCampaignsResult {
  const [campaigns,  setCampaigns]  = useState<Campaign[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);
  const [tick,       setTick]       = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      setIsMockData(false);

      try {
        const cm    = getCampaignManager();
        const count = Number(await cm.campaignCount());

        // If count is 0, still valid — just no campaigns yet
        const fetched: Campaign[] = [];

        for (let i = 0; i < count; i++) {
          const [meta, stats, desc] = await Promise.all([
            cm.getCampaignMeta(i),
            cm.getCampaignStats(i),
            cm.getCampaignDescription(i),
          ]);

          fetched.push({
            id:               i.toString(),
            creatorId:        meta.creator as string,
            creator:          addrToUser(meta.creator as string),
            title:            meta.title as string,
            slug:             meta.slug as string,
            description:      desc as string,
            shortDescription: meta.shortDescription as string,
            goalAmount:       parseFloat(formatEther(stats.goalAmount as bigint)),
            raisedAmount:     parseFloat(formatEther(stats.raisedAmount as bigint)),
            imageUrl:         meta.imageUrl as string,
            category:         meta.category as Campaign['category'],
            status:           STATUS_MAP[Number(stats.status)] ?? CAMPAIGN_STATUS.ACTIVE,
            deadline:         new Date(Number(stats.deadline) * 1000).toISOString(),
            createdAt:        '',
            updatedAt:        '',
            backersCount:     Number(stats.backersCount),
            milestones:       [],
            tokenRewardSymbol: stats.tokenSymbol as string,
            minContribution:  parseFloat(formatEther(stats.minContribution as bigint)),
          });
        }

        if (!cancelled) {
          setCampaigns(fetched);
          setIsMockData(false);
        }
      } catch (err) {
        if (cancelled) return;

        // Contract unreachable (not deployed, Ganache not running, wrong network, etc.)
        // Fall back to mock data so the UI stays usable
        const isContractError =
          err instanceof Error &&
          (err.message.includes('CALL_EXCEPTION') ||
           err.message.includes('could not detect network') ||
           err.message.includes('missing revert data') ||
           err.message.includes('network does not support') ||
           err.message.includes('MetaMask not found') ||
           err.message.includes('BAD_DATA') ||
           err.message.includes('could not decode result data') ||
           err.message.includes('Failed to fetch') ||
           err.message.includes('ECONNREFUSED'));

        if (isContractError) {
          // Apply any demo-mode flag overrides stored in localStorage
          const withOverrides = mockCampaigns.map(c =>
            localStorage.getItem(`sf_demo_flagged_${c.id}`) === 'true'
              ? { ...c, status: CAMPAIGN_STATUS.FLAGGED as Campaign['status'] }
              : c
          );
          setCampaigns(withOverrides);
          setIsMockData(true);
          setError(null); // don't show error — mock data handles it gracefully
        } else {
          setCampaigns([]);
          setIsMockData(false);
          setError(err instanceof Error ? err.message : 'Failed to load campaigns');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [tick]);

  return { campaigns, loading, error, isMockData, refetch };
}
