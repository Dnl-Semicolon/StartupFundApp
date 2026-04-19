import { useEffect, useState } from 'react';
import { formatEther } from 'ethers';
import { getReadContract, STARTUPFUND_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES } from '@/lib/contractAddresses';
import { useWallet } from './useWallet';

export interface ContributorTx {
  type: 'funding' | 'refund' | 'tokens';
  campaignId: string;
  amount: string;
  txHash: string;
  blockNumber: number;
}

export interface ContributorStats {
  totalContributed: string;
  rewardTokens: string;
  transactions: ContributorTx[];
  txCount: number | null;
  isLoading: boolean;
}

export function useContributorStats(): ContributorStats {
  const { address, isConnected } = useWallet();
  const [totalContributed, setTotalContributed] = useState<string>('--');
  const [rewardTokens, setRewardTokens]         = useState<string>('--');
  const [transactions, setTransactions]         = useState<ContributorTx[]>([]);
  const [txCount, setTxCount]                   = useState<number | null>(null);
  const [isLoading, setIsLoading]               = useState(false);

  useEffect(() => {
    if (!address || !isConnected) {
      setTotalContributed('--');
      setRewardTokens('--');
      setTransactions([]);
      setTxCount(null);
      return;
    }

    let cancelled = false;

    async function fetchStats() {
      setIsLoading(true);
      try {
        const sf = getReadContract(CONTRACT_ADDRESSES.startupFund, STARTUPFUND_ABI);

        // Query all events where this address is the contributor
        const [fundingEvents, refundEvents, tokenEvents, tokenBalance] = await Promise.all([
          sf.queryFilter(sf.filters.FundingReceived(null, address), 0),
          sf.queryFilter(sf.filters.RefundClaimed(null, address), 0),
          sf.queryFilter(sf.filters.TokensMinted(null, address), 0),
          sf.tokenBalanceOf(address),
        ]);

        if (cancelled) return;

        // Sum all ETH contributed (wei)
        const totalWei = (fundingEvents as any[]).reduce(
          (acc: bigint, e: any) => acc + BigInt(e.args.amount),
          0n
        );

        // Build unified transaction list
        const txs: ContributorTx[] = [
          ...(fundingEvents as any[]).map((e: any) => ({
            type: 'funding' as const,
            campaignId: e.args.campaignId.toString(),
            amount: parseFloat(formatEther(e.args.amount)).toFixed(4) + ' ETH',
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
          })),
          ...(refundEvents as any[]).map((e: any) => ({
            type: 'refund' as const,
            campaignId: e.args.campaignId.toString(),
            amount: parseFloat(formatEther(e.args.amount)).toFixed(4) + ' ETH',
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
          })),
          ...(tokenEvents as any[]).map((e: any) => ({
            type: 'tokens' as const,
            campaignId: e.args.campaignId.toString(),
            amount: parseFloat(formatEther(e.args.tokens)).toFixed(0) + ' SFT',
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
          })),
        ].sort((a, b) => b.blockNumber - a.blockNumber);

        setTotalContributed(parseFloat(formatEther(totalWei)).toFixed(4));
        setRewardTokens(parseFloat(formatEther(tokenBalance as bigint)).toFixed(0));
        setTransactions(txs);
        setTxCount(txs.length);
      } catch {
        // Contracts unreachable — leave defaults
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, [address, isConnected]);

  return { totalContributed, rewardTokens, transactions, txCount, isLoading };
}
