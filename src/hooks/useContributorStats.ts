import { useEffect, useState, useCallback } from 'react';
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
  totalContributed: string;   // ETH sum of all Funded events
  rewardTokens: string;       // on-chain token balance (1:1 with ETH)
  transactions: ContributorTx[];
  txCount: number | null;
  campaignsBacked: Set<string>; // unique campaign IDs the user funded
  refundedCampaigns: Set<string>; // campaign IDs where user was refunded
  isLoading: boolean;
  refetch: () => void;
}

export function useContributorStats(): ContributorStats {
  const { address, isConnected } = useWallet();
  const [totalContributed, setTotalContributed] = useState<string>('--');
  const [rewardTokens, setRewardTokens]         = useState<string>('--');
  const [transactions, setTransactions]         = useState<ContributorTx[]>([]);
  const [txCount, setTxCount]                   = useState<number | null>(null);
  const [campaignsBacked, setCampaignsBacked]   = useState<Set<string>>(new Set());
  const [refundedCampaigns, setRefundedCampaigns] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading]               = useState(false);
  const [tick, setTick]                         = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  // Auto-refresh every 15 s so stats stay current after on-chain activity
  useEffect(() => {
    if (!isConnected) return;
    const id = setInterval(() => setTick(t => t + 1), 15_000);
    return () => clearInterval(id);
  }, [isConnected]);

  // Also refresh on the global event fired after funding/refund txs
  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('sf:stats-refresh', handler);
    return () => window.removeEventListener('sf:stats-refresh', handler);
  }, []);

  // Optimistic update: immediately reflect a confirmed funding tx in local state
  // so the Transactions tab updates the moment MetaMask confirms (no waiting for eth_getLogs)
  useEffect(() => {
    const handler = (e: Event) => {
      const { campaignId, amount, txHash, blockNumber } = (e as CustomEvent<{
        campaignId: string; amount: string; txHash: string; blockNumber: number;
      }>).detail;

      const optimisticTx: ContributorTx = {
        type: 'funding',
        campaignId,
        amount: parseFloat(amount).toFixed(4) + ' ETH',
        txHash,
        blockNumber,
      };

      setTransactions(prev => {
        if (prev.some(t => t.txHash === txHash)) return prev; // already added by chain re-query
        return [optimisticTx, ...prev];
      });

      setTotalContributed(prev => {
        const current = prev === '--' ? 0 : parseFloat(prev);
        return (current + parseFloat(amount)).toFixed(4);
      });

      setCampaignsBacked(prev => {
        const next = new Set(prev);
        next.add(campaignId);
        return next;
      });

      setTxCount(prev => (prev === null ? 1 : prev + 1));

      // Delayed chain re-query to pick up any on-chain state changes (e.g. reward minting)
      setTimeout(() => setTick(t => t + 1), 3000);
    };

    window.addEventListener('sf:tx-funded', handler);
    return () => window.removeEventListener('sf:tx-funded', handler);
  }, []);

  useEffect(() => {
    if (!address || !isConnected) {
      setTotalContributed('--');
      setRewardTokens('--');
      setTransactions([]);
      setTxCount(null);
      setCampaignsBacked(new Set());
      setRefundedCampaigns(new Set());
      return;
    }

    let cancelled = false;

    async function fetchStats() {
      setIsLoading(true);
      try {
        const sf = getReadContract(CONTRACT_ADDRESSES.startupFund, STARTUPFUND_ABI);
        const addrLower = address!.toLowerCase();

        // Query ALL events then filter client-side — more reliable than indexed filters on Ganache
        const [allFunded, allRefunded, allRewardMinted, tokenBalance] = await Promise.all([
          sf.queryFilter(sf.filters.Funded(), 0),
          sf.queryFilter(sf.filters.Refunded(), 0),
          sf.queryFilter(sf.filters.RewardMinted(), 0),
          sf.tokenBalanceOf(address),
        ]);

        if (cancelled) return;

        const myFunded  = (allFunded  as any[]).filter(e => e.args.contributor?.toLowerCase() === addrLower);
        const myRefunds = (allRefunded as any[]).filter(e => e.args.contributor?.toLowerCase() === addrLower);
        const myRewards = (allRewardMinted as any[]).filter(e => e.args.contributor?.toLowerCase() === addrLower);

        // Total ETH contributed (sum of all Funded events)
        const totalWei = myFunded.reduce(
          (acc: bigint, e: any) => acc + BigInt(e.args.amount),
          0n
        );

        // Unique campaigns backed and refunded
        const backed   = new Set(myFunded.map((e: any) => e.args.campaignId.toString()));
        const refunded = new Set(myRefunds.map((e: any) => e.args.campaignId.toString()));

        // Unified sorted transaction list
        const txs: ContributorTx[] = [
          ...myFunded.map((e: any) => ({
            type: 'funding' as const,
            campaignId: e.args.campaignId.toString(),
            amount: parseFloat(formatEther(e.args.amount)).toFixed(4) + ' ETH',
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
          })),
          ...myRefunds.map((e: any) => ({
            type: 'refund' as const,
            campaignId: e.args.campaignId.toString(),
            amount: parseFloat(formatEther(e.args.amount)).toFixed(4) + ' ETH',
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
          })),
          ...myRewards.map((e: any) => ({
            type: 'tokens' as const,
            campaignId: e.args.campaignId.toString(),
            amount: parseFloat(formatEther(e.args.amount)).toFixed(4) + ' ETH',
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
          })),
        ].sort((a, b) => b.blockNumber - a.blockNumber);

        setTotalContributed(parseFloat(formatEther(totalWei)).toFixed(4));
        setRewardTokens(parseFloat(formatEther(tokenBalance as bigint)).toFixed(4));
        setTransactions(txs);
        setTxCount(txs.length);
        setCampaignsBacked(backed);
        setRefundedCampaigns(refunded);
      } catch {
        // Contracts unreachable — leave current values, will retry on next tick
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, [address, isConnected, tick]);

  return {
    totalContributed,
    rewardTokens,
    transactions,
    txCount,
    campaignsBacked,
    refundedCampaigns,
    isLoading,
    refetch,
  };
}
