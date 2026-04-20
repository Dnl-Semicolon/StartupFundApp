import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useWallet } from './useWallet';
import { getCampaignVoting, CAMPAIGN_VOTING_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES } from '@/lib/contractAddresses';

export interface VoteStatus {
  approves:    number;
  disapproves: number;
  windowEnd:   number;   // unix timestamp in SECONDS
  isSettled:   boolean;
  total:       number;
  approvePct:  number;
}

// Demo-mode: non-numeric campaign IDs (mock data: "c1", "pending-1")
// route all state through localStorage so the Voting UI works without a live chain.
const demoKey = (id: string) => `sf_demo_votes_${id}`;

interface DemoState {
  approves:   number;
  disapproves: number;
  windowEnd:  number;              // unix seconds
  isSettled:  boolean;
  voters:     Record<string, boolean>; // lowercased addr → approve choice
}

function loadDemoState(id: string): DemoState {
  const raw = localStorage.getItem(demoKey(id));
  if (raw) {
    try { return JSON.parse(raw) as DemoState; } catch { /* fallthrough */ }
  }
  // Fresh demo state: 5-minute window so clicking Finalize before voting is blocked.
  return {
    approves:    0,
    disapproves: 0,
    windowEnd:   Math.floor(Date.now() / 1000) + 300,
    isSettled:   false,
    voters:      {},
  };
}

export function useVoting(campaignId: string | undefined) {
  const { address, isConnected } = useWallet();

  const [voteStatus,  setVoteStatus]  = useState<VoteStatus | null>(null);
  const [hasVoted,    setHasVoted]    = useState(false);
  const [userVote,    setUserVote]    = useState<boolean | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [isTxPending, setIsTxPending] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const isDemo = campaignId ? !/^\d+$/.test(campaignId) : false;

  const fetchStatus = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    setError(null);

    if (isDemo) {
      const data  = loadDemoState(campaignId);
      const total = data.approves + data.disapproves;
      setVoteStatus({
        approves:    data.approves,
        disapproves: data.disapproves,
        windowEnd:   data.windowEnd,
        isSettled:   data.isSettled,
        total,
        approvePct:  total > 0 ? Math.round((data.approves / total) * 100) : 0,
      });
      if (address) {
        const myChoice = data.voters[address.toLowerCase()];
        setHasVoted(myChoice !== undefined);
        setUserVote(myChoice ?? null);
      } else {
        setHasVoted(false);
        setUserVote(null);
      }
      setIsLoading(false);
      return;
    }

    try {
      const cv = getCampaignVoting() as Awaited<ReturnType<typeof getCampaignVoting>>;
      // cast narrows the ethers.js Contract to any-like for these calls
      const [approves, disapproves, windowEnd, isSettled] =
        await (cv as unknown as {
          getVoteStatus: (id: bigint) => Promise<[bigint, bigint, bigint, boolean]>;
        }).getVoteStatus(BigInt(campaignId));

      const approvesNum    = Number(approves);
      const disapprovesNum = Number(disapproves);
      const total          = approvesNum + disapprovesNum;

      setVoteStatus({
        approves:    approvesNum,
        disapproves: disapprovesNum,
        windowEnd:   Number(windowEnd),
        isSettled:   Boolean(isSettled),
        total,
        approvePct:  total > 0 ? Math.round((approvesNum / total) * 100) : 0,
      });

      if (address) {
        const voted = await (cv as unknown as {
          hasVoted: (id: bigint, voter: string) => Promise<boolean>;
        }).hasVoted(BigInt(campaignId), address);

        setHasVoted(Boolean(voted));

        if (voted) {
          const choice = await (cv as unknown as {
            voteChoice: (id: bigint, voter: string) => Promise<boolean>;
          }).voteChoice(BigInt(campaignId), address);
          setUserVote(Boolean(choice));
        } else {
          setUserVote(null);
        }
      } else {
        setHasVoted(false);
        setUserVote(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vote status');
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, address, isDemo]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const vote = useCallback(async (approve: boolean) => {
    if (!campaignId || !isConnected || !address) return;
    setIsTxPending(true);
    const toastId = toast.loading(
      approve ? 'Casting approval vote…' : 'Casting disapproval vote…'
    );
    try {
      if (isDemo) {
        const data = loadDemoState(campaignId);
        if (Math.floor(Date.now() / 1000) >= data.windowEnd) {
          throw new Error('Voting window has closed');
        }
        if (data.voters[address.toLowerCase()] !== undefined) {
          throw new Error('Already voted');
        }
        data.voters[address.toLowerCase()] = approve;
        if (approve) data.approves += 1; else data.disapproves += 1;
        localStorage.setItem(demoKey(campaignId), JSON.stringify(data));
        toast.success(approve ? 'Voted to approve.' : 'Voted to disapprove.', { id: toastId });
        await fetchStatus();
        return;
      }
      const cv = await getCampaignVoting(true);
      const tx = await (cv as unknown as {
        vote: (id: bigint, approve: boolean) => Promise<{ wait: () => Promise<unknown> }>;
      }).vote(BigInt(campaignId), approve);
      await tx.wait();
      toast.success(approve ? 'Voted to approve.' : 'Voted to disapprove.', { id: toastId });
      await fetchStatus();
    } catch (err: unknown) {
      const e = err as { code?: number | string; message?: string };
      const userRejected = e?.code === 4001 || e?.code === 'ACTION_REJECTED';
      toast.error(
        userRejected
          ? 'Transaction cancelled.'
          : (e?.message && e.message.length < 140 ? e.message : 'Vote failed. Try again.'),
        { id: toastId }
      );
    } finally {
      setIsTxPending(false);
    }
  }, [campaignId, isConnected, address, isDemo, fetchStatus]);

  const settle = useCallback(async () => {
    if (!campaignId) return;
    setIsTxPending(true);
    const toastId = toast.loading('Finalizing community vote…');
    try {
      if (isDemo) {
        const data = loadDemoState(campaignId);
        if (Math.floor(Date.now() / 1000) < data.windowEnd) {
          throw new Error('Window still open');
        }
        data.isSettled = true;
        localStorage.setItem(demoKey(campaignId), JSON.stringify(data));
        toast.success('Vote finalized.', { id: toastId });
        await fetchStatus();
        return;
      }
      const cv = await getCampaignVoting(true);
      const tx = await (cv as unknown as {
        settleVoting: (id: bigint) => Promise<{ wait: () => Promise<unknown> }>;
      }).settleVoting(BigInt(campaignId));
      await tx.wait();
      toast.success('Vote finalized — campaign status updated.', { id: toastId });
      await fetchStatus();
    } catch (err: unknown) {
      const e = err as { code?: number | string; message?: string };
      const userRejected = e?.code === 4001 || e?.code === 'ACTION_REJECTED';
      toast.error(
        userRejected
          ? 'Transaction cancelled.'
          : (e?.message && e.message.length < 140 ? e.message : 'Settlement failed.'),
        { id: toastId }
      );
    } finally {
      setIsTxPending(false);
    }
  }, [campaignId, isDemo, fetchStatus]);

  // Silence unused-lint if the ABI import is kept for downstream typing
  void CAMPAIGN_VOTING_ABI;
  void CONTRACT_ADDRESSES;

  return {
    voteStatus,
    hasVoted,
    userVote,
    isLoading,
    isTxPending,
    error,
    vote,
    settle,
    refetch: fetchStatus,
    isDemo,
  };
}
