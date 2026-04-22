import { useEffect, useState } from 'react';
import { formatEther } from 'ethers';
import { getFundingVault } from '@/lib/contracts';
import { Campaign } from '@/lib/index';
import { getContributions } from '@/lib/demoState';

export interface ContributorEntry {
  address: string;
  amount: number;  // ETH
}

/**
 * Resolves the full contributor list for a campaign. For on-chain (numeric id)
 * campaigns, reads FundingVault.getContributors + getContribution per address.
 * For mock/demo campaigns, reads from the seeded Campaign.contributors array
 * merged with any demoState-recorded off-chain contributions.
 */
export function useContributors(campaign: Campaign | undefined): {
  contributors: ContributorEntry[];
  loading: boolean;
  error: string | null;
} {
  const [contributors, setContributors] = useState<ContributorEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      if (!campaign) {
        setContributors([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      const isChain = /^\d+$/.test(campaign.id);
      if (!isChain) {
        // Mock path: seeded contributors + any demoState additions
        const seeded = campaign.contributors ?? [];
        const demo   = getContributions(campaign.id).map(c => ({
          address: c.address,
          amount:  c.amount,
        }));
        if (!cancelled) {
          setContributors([...seeded, ...demo]);
          setLoading(false);
        }
        return;
      }

      try {
        const fv    = getFundingVault();
        const addrs = await (fv as unknown as {
          getContributors: (id: bigint) => Promise<string[]>;
        }).getContributors(BigInt(campaign.id));

        const entries: ContributorEntry[] = await Promise.all(
          addrs.map(async (addr) => {
            const wei = await (fv as unknown as {
              getContribution: (id: bigint, a: string) => Promise<bigint>;
            }).getContribution(BigInt(campaign.id), addr);
            return { address: addr, amount: parseFloat(formatEther(wei)) };
          })
        );

        // Merge any demoState-recorded off-chain contributions so seeded demo
        // state still shows up for hacked flows.
        const demo = getContributions(campaign.id).map(c => ({
          address: c.address,
          amount:  c.amount,
        }));

        if (!cancelled) {
          setContributors([...entries, ...demo]);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load contributors');
          setLoading(false);
        }
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [campaign]);

  return { contributors, loading, error };
}
