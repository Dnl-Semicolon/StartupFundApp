import { useEffect, useState, useCallback } from 'react';
import { formatEther } from 'ethers';
import { getCampaignManager } from '@/lib/contracts';
import { Campaign, CAMPAIGN_STATUS } from '@/lib/index';
import { mockCampaigns } from '@/data/index';
import { loadDemoState } from '@/lib/demoState';

// Maps CampaignManager uint8 status → frontend string.
// After the voting-gate redeploy: 0=PENDING, 1=ACTIVE, 2=FUNDED, 3=CANCELLED, 4=REJECTED.
const STATUS_MAP: Record<number, Campaign['status']> = {
  0: CAMPAIGN_STATUS.PENDING,
  1: CAMPAIGN_STATUS.ACTIVE,
  2: CAMPAIGN_STATUS.FUNDED,
  3: CAMPAIGN_STATUS.CANCELLED,
  4: CAMPAIGN_STATUS.REJECTED,
};

/** Peels the optional "\n---meta\n{...json}" tail off a description and
 *  returns the cleaned description plus any structured metadata found. */
function parseDescription(raw: string): {
  description: string;
  profitReturnRate?: number;
  profitReturnDeadline?: string;
} {
  const marker = '\n---meta\n';
  const idx = raw.lastIndexOf(marker);
  if (idx === -1) return { description: raw };
  const body = raw.slice(0, idx);
  const tail = raw.slice(idx + marker.length).trim();
  try {
    const parsed = JSON.parse(tail) as { profitReturnRate?: number; profitReturnDeadline?: string };
    return {
      description: body,
      profitReturnRate:     typeof parsed.profitReturnRate     === 'number' ? parsed.profitReturnRate     : undefined,
      profitReturnDeadline: typeof parsed.profitReturnDeadline === 'string' ? parsed.profitReturnDeadline : undefined,
    };
  } catch {
    return { description: raw };
  }
}

/** Merge a demoState override on top of a chain-derived Campaign.
 *  Overlay wins: statusOverride (voting skip, disbursement, refund reclaim),
 *  deadlineOverride (Option Y sub-1-day hijack). */
function applyOverlay(campaign: Campaign): Campaign {
  const ov = loadDemoState().overrides[campaign.id];
  if (!ov) return campaign;
  return {
    ...campaign,
    status:   ov.statusOverride   ?? campaign.status,
    deadline: ov.deadlineOverride ?? campaign.deadline,
  };
}

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
        console.debug('[sf:campaigns] campaignCount =', count);

        // If count is 0, still valid — just no campaigns yet
        const fetched: Campaign[] = [];

        for (let i = 0; i < count; i++) {
          const [meta, stats, desc, tags] = await Promise.all([
            cm.getCampaignMeta(i),
            cm.getCampaignStats(i),
            cm.getCampaignDescription(i),
            cm.getCampaignTags(i),
          ]);

          const parsedDesc = parseDescription(desc as string);

          fetched.push({
            id:               i.toString(),
            creatorId:        meta.creator as string,
            creator:          addrToUser(meta.creator as string),
            title:            meta.title as string,
            slug:             meta.slug as string,
            description:      parsedDesc.description,
            profitReturnRate: parsedDesc.profitReturnRate,
            profitReturnDeadline: parsedDesc.profitReturnDeadline,
            shortDescription: meta.shortDescription as string,
            goalAmount:       parseFloat(formatEther(stats.goalAmount as bigint)),
            raisedAmount:     parseFloat(formatEther(stats.raisedAmount as bigint)),
            imageUrl:         meta.imageUrl as string,
            category:         meta.category as Campaign['category'],
            status:           STATUS_MAP[Number(stats.status)] ?? CAMPAIGN_STATUS.PENDING,
            deadline:         new Date(Number(stats.deadline) * 1000).toISOString(),
            createdAt:        '',
            updatedAt:        '',
            backersCount:     Number(stats.backersCount),
            milestones:       [],
            tokenRewardSymbol: stats.tokenSymbol as string,
            minContribution:  parseFloat(formatEther(stats.minContribution as bigint)),
            tags:             tags as string[],
          });
        }

        if (!cancelled) {
          const overlaid = fetched.map(applyOverlay);
          console.debug('[sf:campaigns] loaded', overlaid.length, 'campaigns from chain (overlay applied)',
            overlaid.map(c => ({ id: c.id, status: c.status, creator: c.creatorId })));
          setCampaigns(overlaid);
          setIsMockData(false);
        }
      } catch (err) {
        if (cancelled) return;
        console.warn('[sf:campaigns] fetch failed — falling back to mock?', err);

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
          // Mock-data fallback still respects demo-state overlays
          const withOverrides = mockCampaigns.map(c => {
            const withFlag = localStorage.getItem(`sf_demo_flagged_${c.id}`) === 'true'
              ? { ...c, status: CAMPAIGN_STATUS.FLAGGED as Campaign['status'] }
              : c;
            return applyOverlay(withFlag);
          });
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
