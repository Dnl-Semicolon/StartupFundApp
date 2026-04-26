import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { parseEther, formatEther } from 'ethers';
import { getStartupFund, getReadContract, getFundingVault, ensureRegistered, STARTUPFUND_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES } from '@/lib/contractAddresses';
import { useWallet } from '@/hooks/useWallet';
import { useRegistration } from '@/hooks/useRegistration';
import { ConnectPrompt } from '@/components/ConnectPrompt';
import {
  Clock,
  Users,
  Target,
  Shield,
  CheckCircle2,
  Circle,
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  Award,
  Flag,
  XCircle,
  Pencil
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ROUTE_PATHS,
  Campaign,
  CAMPAIGN_STATUS
} from '@/lib/index';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Loader2 } from 'lucide-react';
import { StatsCard } from '@/components/Cards';
import { FundCampaignForm, WithdrawForm, RefundRequestForm, FlagCampaignForm } from '@/components/Forms';
import { VotingPanel } from '@/components/VotingPanel';
import { DisburseProfitsForm } from '@/components/DisburseProfitsForm';
import { getOverride, recordReclaim } from '@/lib/demoState';
import { useContributors } from '@/hooks/useContributors';
import { useChainNow } from '@/hooks/useChainNow';
import { toast } from 'sonner';

// Per-session dedupe so the lazy auto-refund only fires once per campaign per
// browser session — prevents re-prompting MetaMask on every navigation.
const autoRefundAttempted = new Set<string>();
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';

// ─────────────────────────────────────────────────────────────────────────────
// RefundFormWithContribution
// Wraps RefundRequestForm, resolving the connected wallet's contribution
// amount from useContributors so the Claim Refund button correctly disables
// when the viewer has zero stake in the cancelled campaign.
// ─────────────────────────────────────────────────────────────────────────────
function RefundFormWithContribution({
  campaign, connectedAddress, onSubmit,
}: {
  campaign: Campaign;
  connectedAddress: string | null;
  onSubmit: () => Promise<void>;
}) {
  // Pull HISTORICAL contribution from FundingReceived events (vault zeroes
  // the live `contributions` mapping during refund, so reading getContribution
  // post-refund returns 0). Also resolve refundClaimed to flip the card to a
  // success state instead of leaving the active CTA visible.
  const [historical,    setHistorical]    = useState(0);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  useEffect(() => {
    if (!connectedAddress) return;
    if (!/^\d+$/.test(campaign.id)) return;
    let cancelled = false;
    (async () => {
      try {
        const sf = getReadContract(CONTRACT_ADDRESSES.startupFund, STARTUPFUND_ABI);
        const events = await (sf as unknown as {
          queryFilter: (f: unknown, from: number) => Promise<Array<{ args: { campaignId: bigint; contributor: string; amount: bigint } }>>;
          filters: { FundingReceived: () => unknown };
        }).queryFilter(sf.filters.FundingReceived(), 0);
        const my = events.filter(e =>
          e.args.contributor?.toLowerCase() === connectedAddress.toLowerCase() &&
          e.args.campaignId.toString() === campaign.id
        );
        const totalWei = my.reduce((acc, e) => acc + BigInt(e.args.amount), 0n);
        if (cancelled) return;
        setHistorical(parseFloat(formatEther(totalWei)));

        const fv = getFundingVault();
        const claimed = await (fv as unknown as {
          refundClaimed: (id: bigint, addr: string) => Promise<boolean>;
        }).refundClaimed(BigInt(campaign.id), connectedAddress);
        if (!cancelled) setAlreadyClaimed(Boolean(claimed));
      } catch (err) {
        console.debug('sf:refund-form:history-fetch-failed', err);
      }
    })();
    return () => { cancelled = true; };
  }, [campaign.id, connectedAddress, campaign.status, campaign.raisedAmount]);

  return (
    <RefundRequestForm
      campaignId={campaign.id}
      contributionAmount={historical}
      alreadyRefunded={alreadyClaimed}
      onSubmit={onSubmit}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PayoutPotPanel
// Real on-chain profit-disbursement flow for FUNDED campaigns that promised a
// profit return at create time. Three roles:
//   - Creator (pre-deadline, pot empty)   → "Fund the payout pot" CTA
//   - Creator (pre-deadline, pot funded)  → "Pot funded — awaiting deadline"
//   - Backer  (pre-deadline)              → "Awaiting profit disbursement" + countdown
//   - Anyone  (post-deadline, !disbursed) → lazy auto-fire disburseProfits()
//   - Anyone  (disbursed)                 → "Profits disbursed" success
// ─────────────────────────────────────────────────────────────────────────────
function PayoutPotPanel({
  campaign, isCreator, connectedAddress, chainNow,
}: {
  campaign: Campaign;
  isCreator: boolean;
  connectedAddress: string | null;
  chainNow: number;
}) {
  const isFunded = campaign.status === CAMPAIGN_STATUS.FUNDED;
  const rate     = campaign.profitReturnRate ?? 0;
  const deadline = campaign.profitReturnDeadline;
  const hasTerms = rate > 0 && !!deadline;

  const [pot,        setPot]       = useState<bigint>(0n);
  const [disbursed,  setDisbursed] = useState(false);
  const [required,   setRequired]  = useState<bigint>(0n);
  const [busy,       setBusy]      = useState(false);

  const refresh = useCallback(async () => {
    if (!hasTerms || !/^\d+$/.test(campaign.id)) return;
    try {
      const fv = getFundingVault();
      const sf = getReadContract(CONTRACT_ADDRESSES.startupFund, STARTUPFUND_ABI);
      const [potWei, done, req] = await Promise.all([
        (fv as unknown as { payoutPot: (id: bigint) => Promise<bigint> }).payoutPot(BigInt(campaign.id)),
        (fv as unknown as { payoutDisbursed: (id: bigint) => Promise<boolean> }).payoutDisbursed(BigInt(campaign.id)),
        (sf as unknown as { payoutRequired: (id: bigint) => Promise<bigint> }).payoutRequired(BigInt(campaign.id)),
      ]);
      setPot(potWei);
      setDisbursed(Boolean(done));
      setRequired(req);
    } catch (err) {
      console.debug('sf:payout:refresh-failed', err);
    }
  }, [campaign.id, hasTerms]);

  useEffect(() => { refresh(); }, [refresh, campaign.status, chainNow]);

  // Lazy auto-disburse: when chainNow >= profitReturnDeadline, pot is fully
  // funded, and not yet disbursed — first registered visitor fires it.
  useEffect(() => {
    if (!hasTerms || !/^\d+$/.test(campaign.id)) return;
    if (!isFunded) return;
    if (!connectedAddress) return;
    if (disbursed) return;
    if (pot === 0n) return;
    const deadlineSec = Math.floor(new Date(deadline!).getTime() / 1000);
    if (chainNow < deadlineSec) return;
    if (autoDisburseAttempted.has(campaign.id)) return;
    autoDisburseAttempted.add(campaign.id);
    (async () => {
      try {
        const sf = await getStartupFund(true);
        const tx = await (sf as unknown as { disburseProfits: (id: bigint) => Promise<{ wait: () => Promise<unknown> }> })
          .disburseProfits(BigInt(campaign.id));
        await tx.wait();
        toast.success('Profits disbursed to all backers.');
        await refresh();
        window.dispatchEvent(new Event('sf:stats-refresh'));
      } catch (err) {
        console.debug('sf:disburse auto-trigger skipped/failed', err);
      }
    })();
  }, [hasTerms, campaign.id, isFunded, connectedAddress, disbursed, pot, chainNow, deadline, refresh]);

  if (!isFunded || !hasTerms) return null;

  const handleFundPot = async () => {
    if (!connectedAddress) return;
    setBusy(true);
    try {
      const sf = await getStartupFund(true);
      const tx = await (sf as unknown as {
        fundPayoutPot: (id: bigint, opts: { value: bigint }) => Promise<{ wait: () => Promise<unknown> }>;
      }).fundPayoutPot(BigInt(campaign.id), { value: required });
      await tx.wait();
      toast.success('Payout pot funded.');
      await refresh();
    } catch (err) {
      console.error('sf:fund-payout-pot-failed', err);
      const msg = (err as { shortMessage?: string; message?: string })?.shortMessage
        ?? (err as { message?: string })?.message
        ?? 'Failed to fund payout pot';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const deadlineDate = new Date(deadline!);
  const deadlineSec = Math.floor(deadlineDate.getTime() / 1000);
  const past = chainNow >= deadlineSec;
  const requiredEth = parseFloat(formatEther(required));
  const potEth      = parseFloat(formatEther(pot));

  if (disbursed) {
    return (
      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm space-y-1">
        <p className="font-semibold text-emerald-400">Profits Disbursed</p>
        <p className="text-xs text-muted-foreground">
          Backers received their share of the {requiredEth.toFixed(4)} ETH payout
          pot proportional to their contribution ({rate}% profit on principal).
        </p>
      </div>
    );
  }

  // Creator view: fund the pot
  if (isCreator) {
    if (pot === 0n) {
      return (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 space-y-3">
          <div>
            <p className="font-semibold text-amber-400 text-sm">Profit Return Owed</p>
            <p className="text-xs text-muted-foreground mt-1">
              You promised {rate}% profit by{' '}
              <span className="font-mono text-foreground">{deadlineDate.toLocaleString()}</span>.
              Deposit the exact payout pot now so backers can be paid out
              automatically when the deadline arrives.
            </p>
          </div>
          <div className="bg-background/50 rounded p-3 space-y-1 text-xs font-mono">
            <div className="flex justify-between"><span>Raised</span><span>{campaign.raisedAmount.toFixed(4)} ETH</span></div>
            <div className="flex justify-between"><span>Profit ({rate}%)</span><span>{(campaign.raisedAmount * rate / 100).toFixed(4)} ETH</span></div>
            <div className="flex justify-between font-semibold border-t border-border/40 pt-1 mt-1">
              <span>Required deposit</span><span>{requiredEth.toFixed(4)} ETH</span>
            </div>
          </div>
          <Button
            onClick={handleFundPot}
            disabled={busy || past}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            {busy ? 'Submitting…' : past ? 'Deadline passed' : `Fund pot (${requiredEth.toFixed(4)} ETH)`}
          </Button>
        </div>
      );
    }
    return (
      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm space-y-1">
        <p className="font-semibold text-emerald-400">Payout Pot Funded</p>
        <p className="text-xs text-muted-foreground">
          {potEth.toFixed(4)} ETH locked. Auto-disburses to backers at{' '}
          <span className="font-mono text-foreground">{deadlineDate.toLocaleString()}</span>.
        </p>
      </div>
    );
  }

  // Backer / general view
  return (
    <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4 text-sm space-y-1">
      <p className="font-semibold text-blue-400">
        {pot === 0n ? 'Awaiting Creator Deposit' : 'Awaiting Disbursement'}
      </p>
      <p className="text-xs text-muted-foreground">
        Creator promised {rate}% profit return by{' '}
        <span className="font-mono text-foreground">{deadlineDate.toLocaleString()}</span>.
        {pot === 0n
          ? ' Pot has not been funded yet.'
          : ` ${potEth.toFixed(4)} ETH is locked, ready to disburse.`}
      </p>
    </div>
  );
}

// Per-session dedupe for the lazy auto-disburse trigger.
const autoDisburseAttempted = new Set<string>();

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected } = useWallet();
  const { isRegistered } = useRegistration();
  const { campaigns, loading: campaignsLoading, refetch: refetchCampaigns } = useCampaigns();
  const chainNow = useChainNow();

  const campaign = useMemo(() => {
    return campaigns.find(c => c.id === id || c.slug === id);
  }, [campaigns, id]);

  // All hooks must be called unconditionally — before any early returns.
  // Time-left is computed against CHAIN time (not wall clock) so the dev-panel
  // warp correctly trips deadlines in the UI.
  const timeLeft = useMemo(() => {
    if (!campaign) return { secs: 0, label: '0', expired: true, deadlineDate: new Date(0) };
    const deadline = new Date(campaign.deadline);
    const deadlineSec = Math.floor(deadline.getTime() / 1000);
    const remaining = Math.max(0, deadlineSec - chainNow);
    const expired = remaining === 0;
    let label: string;
    if (expired) {
      label = 'Closed';
    } else if (remaining >= 86400) {
      const d = Math.floor(remaining / 86400);
      const h = Math.floor((remaining % 86400) / 3600);
      label = h > 0 ? `${d}d ${h}h` : `${d}d`;
    } else if (remaining >= 3600) {
      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      label = m > 0 ? `${h}h ${m}m` : `${h}h`;
    } else if (remaining >= 60) {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      label = `${m}m ${s}s`;
    } else {
      label = `${remaining}s`;
    }
    return { secs: remaining, label, expired, deadlineDate: deadline };
  }, [campaign, chainNow]);
  const daysLeft = timeLeft.secs > 0 ? Math.ceil(timeLeft.secs / 86400) : 0;

  // ── Flag state ────────────────────────────────────────────────────────────
  const FLAG_THRESHOLD = 5;

  const [flagCount,        setFlagCount]        = useState(0);
  const [hasAlreadyFlagged, setHasAlreadyFlagged] = useState(false);
  // demo mode only: campaign reached threshold → treat as FLAGGED status
  const [demoFlagged,      setDemoFlagged]      = useState(false);
  // On-chain: has the creator already withdrawn? Drives the "Already withdrawn"
  // celebration card vs. the active Withdraw button.
  const [fundsReleased,    setFundsReleased]    = useState(false);

  // localStorage helpers for demo mode persistence
  const demoFlaggKey  = (cid: string) => `sf_demo_flags_${cid}`;
  const demoFlaggdKey = (cid: string) => `sf_demo_flagged_${cid}`;

  useEffect(() => {
    if (!campaign) return;
    const isDemo = !/^\d+$/.test(campaign.id);

    if (isDemo) {
      // Load persisted demo flags from localStorage
      const raw = localStorage.getItem(demoFlaggKey(campaign.id));
      const flaggers: string[] = raw ? JSON.parse(raw) : [];
      setFlagCount(flaggers.length);
      setHasAlreadyFlagged(address ? flaggers.includes(address.toLowerCase()) : false);
      setDemoFlagged(localStorage.getItem(demoFlaggdKey(campaign.id)) === 'true');
    } else {
      // Load from chain
      const sf = getReadContract(CONTRACT_ADDRESSES.startupFund, STARTUPFUND_ABI);
      const cid = BigInt(campaign.id);
      sf.flagCount(cid)
        .then((count: bigint) => setFlagCount(Number(count)))
        .catch(() => {});
      if (address) {
        sf.hasFlagged(cid, address)
          .then((flagged: boolean) => setHasAlreadyFlagged(flagged))
          .catch(() => {});
      } else {
        setHasAlreadyFlagged(false);
      }
    }
  }, [campaign?.id, address]);

  // Read FundingVault.fundsReleased(campaignId) for numeric IDs only.
  // Refresh whenever the campaign changes (e.g. after refetch from withdraw tx).
  useEffect(() => {
    if (!campaign) return;
    if (!/^\d+$/.test(campaign.id)) { setFundsReleased(false); return; }
    let cancelled = false;
    const fv = getFundingVault();
    (fv as unknown as { fundsReleased: (id: bigint) => Promise<boolean> })
      .fundsReleased(BigInt(campaign.id))
      .then((r) => { if (!cancelled) setFundsReleased(Boolean(r)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [campaign?.id, campaign?.raisedAmount, campaign?.status]);

  // Lazy auto-refund: fires when a campaign's deadline has passed (per CHAIN
  // clock) and goal wasn't met. Mirrors voting auto-settle. Status may still
  // read ACTIVE on chain (no one's called checkAndUpdateStatus yet) — that's
  // fine because refundAll() calls checkAndUpdateStatus internally before its
  // CANCELLED guard. Module-level dedupe avoids repeat MetaMask popups.
  useEffect(() => {
    if (!campaign || !address || !isConnected || !isRegistered) return;
    if (!/^\d+$/.test(campaign.id)) return;
    if (autoRefundAttempted.has(campaign.id)) return;
    if (campaign.status === CAMPAIGN_STATUS.FUNDED) return;
    if (campaign.status === CAMPAIGN_STATUS.PENDING) return;
    if (campaign.status === CAMPAIGN_STATUS.REJECTED) return;
    // Either already CANCELLED, or ACTIVE with deadline trip + goal-miss
    const deadlineTripped = timeLeft.expired && campaign.raisedAmount < campaign.goalAmount;
    if (campaign.status !== CAMPAIGN_STATUS.CANCELLED && !deadlineTripped) return;
    let cancelled = false;
    (async () => {
      try {
        const fv = getFundingVault();
        const balance = await (fv as unknown as { vaultBalance: (id: bigint) => Promise<bigint> })
          .vaultBalance(BigInt(campaign.id));
        if (cancelled) return;
        if (balance === 0n) return;
        autoRefundAttempted.add(campaign.id);
        const sf = await getStartupFund(true);
        const tx = await (sf as unknown as { refundAll: (id: bigint) => Promise<{ wait: () => Promise<unknown> }> })
          .refundAll(BigInt(campaign.id));
        await tx.wait();
        toast.success('Refunds issued to all backers.');
        refetchCampaigns();
        window.dispatchEvent(new Event('sf:stats-refresh'));
      } catch (err) {
        console.debug('sf:refundAll auto-trigger skipped/failed', err);
      }
    })();
    return () => { cancelled = true; };
  }, [campaign?.id, campaign?.status, campaign?.raisedAmount, campaign?.goalAmount,
      timeLeft.expired, address, isConnected, isRegistered, refetchCampaigns]);

  if (campaignsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">Campaign Not Found</h1>
        <p className="text-muted-foreground">The project you are looking for doesn't exist or has been removed.</p>
        <Link to={ROUTE_PATHS.CAMPAIGNS} className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Discovery
        </Link>
      </div>
    );
  }

  const progress = Math.min(100, (campaign.raisedAmount / campaign.goalAmount) * 100);
  const isCreator = !!(address && campaign.creator.walletAddress &&
    address.toLowerCase() === campaign.creator.walletAddress.toLowerCase());

  // In demo mode, demoFlagged overrides the campaign status when threshold is hit
  const effectiveStatus = demoFlagged ? CAMPAIGN_STATUS.FLAGGED : campaign.status;

  // Sidebar form visibility rules
  const canAct           = isConnected && isRegistered;
  const showFundForm     = canAct && !isCreator && effectiveStatus === CAMPAIGN_STATUS.ACTIVE && !timeLeft.expired;
  const showWithdrawForm = isCreator && effectiveStatus === CAMPAIGN_STATUS.FUNDED;
  const showRefundForm   = canAct && !isCreator && (effectiveStatus === CAMPAIGN_STATUS.CANCELLED || effectiveStatus === CAMPAIGN_STATUS.FLAGGED);
  const showFlagButton   = !isCreator && effectiveStatus === CAMPAIGN_STATUS.ACTIVE;
  const showConnectPrompt = !isConnected && effectiveStatus === CAMPAIGN_STATUS.ACTIVE && !isCreator;
  const showCreatorActive = isCreator && effectiveStatus === CAMPAIGN_STATUS.ACTIVE;

  const handleFundingSubmit = async (amount: number): Promise<void> => {
    if (!address) throw new Error('Wallet not connected');
    await ensureRegistered(address);
    const contract = await getStartupFund(true);
    const tx = await contract.fundCampaign(BigInt(campaign.id), {
      value: parseEther(amount.toString()),
    });
    const receipt = await tx.wait();
    toast.success(`Contributed ${amount} ETH`);
    // Optimistic dashboard update — fires immediately so /dashboard's
    // "Campaigns I Backed" + Total Contributed reflect the tx without waiting
    // for the 15s polling tick.
    window.dispatchEvent(new CustomEvent('sf:tx-funded', { detail: {
      campaignId: campaign.id,
      amount: amount.toString(),
      txHash: receipt?.hash ?? tx.hash,
      blockNumber: receipt?.blockNumber ?? 0,
    } }));
    refetchCampaigns();
  };

  const handleWithdrawSubmit = async (): Promise<void> => {
    if (!address) throw new Error('Wallet not connected');
    const contract = await getStartupFund(true);
    const tx = await contract.withdraw(BigInt(campaign.id));
    await tx.wait();
    toast.success('Funds withdrawn — reward tokens minted to backers.');
    refetchCampaigns();
    setFundsReleased(true);
  };

  const handleRefundSubmit = async (): Promise<void> => {
    if (!address) throw new Error('Wallet not connected');
    await ensureRegistered(address);
    const contract = await getStartupFund(true);
    const tx = await contract.claimRefund(BigInt(campaign.id));
    await tx.wait();
    toast.success('Refund claimed.');
    refetchCampaigns();
  };

  const handleFlagSubmit = async (): Promise<void> => {
    if (!address) throw new Error('Wallet not connected');
    await ensureRegistered(address);
    const contract = await getStartupFund(true);
    const tx = await contract.flagCampaign(BigInt(campaign.id));
    await tx.wait();
    setFlagCount(prev => prev + 1);
    setHasAlreadyFlagged(true);
    toast.success('Campaign flagged.');
    refetchCampaigns();
    // If threshold tripped, the same tx auto-cancels + refunds. Stats need
    // to refresh so dashboards reflect the refund.
    window.dispatchEvent(new Event('sf:stats-refresh'));
  };

  const handleUnflagSubmit = async (): Promise<void> => {
    if (!address) throw new Error('Wallet not connected');
    await ensureRegistered(address);
    const contract = await getStartupFund(true);
    const tx = await contract.unflagCampaign(BigInt(campaign.id));
    await tx.wait();
    setFlagCount(prev => Math.max(0, prev - 1));
    setHasAlreadyFlagged(false);
    toast.success('Flag removed.');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link 
        to={ROUTE_PATHS.CAMPAIGNS} 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.section 
            initial="hidden" 
            animate="visible" 
            variants={fadeInUp}
            className="space-y-6"
          >
            <div className="aspect-video rounded-2xl overflow-hidden relative border border-border bg-muted">
              <img 
                src={campaign.imageUrl} 
                alt={campaign.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-md">
                  {campaign.category}
                </Badge>
                <Badge
                  className={
                    effectiveStatus === CAMPAIGN_STATUS.ACTIVE  ? 'bg-chart-2 text-white' :
                    effectiveStatus === CAMPAIGN_STATUS.FLAGGED ? 'bg-red-600 text-white' :
                    'bg-muted text-muted-foreground'
                  }
                >
                  {effectiveStatus.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">{campaign.title}</h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {campaign.shortDescription}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard 
                title="Raised"
                value={`${campaign.raisedAmount.toLocaleString()} ETH`}
              />
              <StatsCard 
                title="Goal"
                value={`${campaign.goalAmount.toLocaleString()} ETH`}
              />
              <StatsCard 
                title="Backers"
                value={campaign.backersCount.toString()}
              />
              <StatsCard
                title="Time Left"
                value={
                  campaign.status === CAMPAIGN_STATUS.CANCELLED ||
                  campaign.status === CAMPAIGN_STATUS.REJECTED
                    ? 'Closed'
                    : timeLeft.label
                }
                strikethrough={
                  (campaign.status === CAMPAIGN_STATUS.CANCELLED ||
                   campaign.status === CAMPAIGN_STATUS.REJECTED) &&
                  !timeLeft.expired
                }
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Deadline:{' '}
              <span className="font-mono">
                {timeLeft.deadlineDate.toLocaleString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
              {' · '}chain clock drives the countdown (see DevPanel)
            </p>
          </motion.section>

          <Separator />

          <motion.section 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold">About the Project</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-7">
                {campaign.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <Card className="bg-accent/5 border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Security & Transparency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    All funds are held in a secure multi-sig smart contract. Milestones must be verified before subsequent fund releases.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-accent/5 border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="w-4 h-4 text-chart-2" />
                    Reward Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Contributors receive {campaign.tokenRewardSymbol} governance tokens proportional to their stake in this project.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          <motion.section 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold">Roadmap & Milestones</h2>
            <div className="space-y-4">
              {campaign.milestones.map((milestone, idx) => (
                <motion.div 
                  key={milestone.id} 
                  variants={staggerItem}
                  className="flex gap-4 items-start"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${milestone.isReached ? 'bg-chart-2/10 border-chart-2 text-chart-2' : 'border-muted text-muted-foreground'}`}>
                      {milestone.isReached ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-4 h-4" />}
                    </div>
                    {idx < campaign.milestones.length - 1 && (
                      <div className="w-0.5 h-12 bg-border my-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <h3 className="font-semibold text-lg">{milestone.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        TARGET: {milestone.targetAmount} ETH
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>

        <aside className="space-y-6">
          {/* PENDING campaigns replace the whole sidebar with the voting panel.
              No funding/withdraw/refund/flag affordances are valid here. */}
          {campaign.status === CAMPAIGN_STATUS.PENDING && (
            <div className="sticky top-24 space-y-3">
              <VotingPanel
                campaignId={campaign.id}
                creatorAddress={campaign.creator.walletAddress}
              />
              <div className="flex items-center justify-center gap-4 text-muted-foreground px-4 py-3 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm">
                <div className="flex items-center gap-1 text-[11px]">
                  <Target className="w-3 h-3" />
                  Verified
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <Users className="w-3 h-3" />
                  Community Led
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3" />
                  Active {new Date().getFullYear()}
                </div>
              </div>
            </div>
          )}

          {/* REJECTED campaigns show a terminal banner. Nothing actionable. */}
          {campaign.status === CAMPAIGN_STATUS.REJECTED && (
            <Card className="sticky top-24 border-red-500/25 bg-red-500/5 shadow-lg shadow-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-5 h-5" />
                  Campaign Rejected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This campaign did not meet the community approval threshold and cannot accept contributions.
                </p>
                <div className="flex items-center justify-center gap-4 text-muted-foreground pt-3 border-t border-border/40">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Target className="w-3 h-3" />
                    Verified
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <Users className="w-3 h-3" />
                    Community Led
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    Active {new Date().getFullYear()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {campaign.status !== CAMPAIGN_STATUS.PENDING && campaign.status !== CAMPAIGN_STATUS.REJECTED && (
          <Card className="sticky top-24 border-2 border-primary/10 shadow-xl">
            <CardHeader>
              <CardTitle>
                {showFundForm     && 'Back this project'}
                {showWithdrawForm && 'Withdraw Funds'}
                {showRefundForm   && 'Claim Your Refund'}
                {showCreatorActive && 'Your Campaign'}
                {!showFundForm && !showWithdrawForm && !showRefundForm && !showCreatorActive && 'Campaign Status'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Progress bar — always visible */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* ACTIVE + contributor + not creator → Fund form */}
              {showFundForm && (
                <FundCampaignForm
                  campaignId={campaign.id}
                  onSubmit={handleFundingSubmit}
                />
              )}

              {/* FUNDED + creator → Withdraw button OR "Already withdrawn" card */}
              {showWithdrawForm && !fundsReleased && (
                <WithdrawForm
                  campaignId={campaign.id}
                  onSubmit={handleWithdrawSubmit}
                />
              )}
              {showWithdrawForm && fundsReleased && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-center space-y-1">
                  <p className="font-semibold text-emerald-400">Funds Withdrawn</p>
                  <p className="text-muted-foreground text-xs">
                    The raised ETH has been released to the creator and reward
                    tokens minted to all backers.
                  </p>
                </div>
              )}

              {/* CANCELLED + contributor + not creator → Refund form */}
              {showRefundForm && (
                <RefundFormWithContribution
                  campaign={campaign}
                  connectedAddress={address}
                  onSubmit={handleRefundSubmit}
                />
              )}

              {/* FUNDED + profit-return promised → creator funds payout pot,
                  backers see "Awaiting", auto-disburses at deadline. */}
              <PayoutPotPanel
                campaign={campaign}
                isCreator={isCreator}
                connectedAddress={address}
                chainNow={chainNow}
              />

              {/* ACTIVE + registered non-creator → Flag form */}
              {showFlagButton && (
                <FlagCampaignForm
                  flagCount={flagCount}
                  threshold={FLAG_THRESHOLD}
                  hasAlreadyFlagged={hasAlreadyFlagged}
                  isRegistered={isRegistered}
                  onFlag={handleFlagSubmit}
                  onUnflag={handleUnflagSubmit}
                />
              )}

              {/* FLAGGED → banner for everyone */}
              {effectiveStatus === CAMPAIGN_STATUS.FLAGGED && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 text-sm text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-red-700 dark:text-red-400 font-semibold">
                    <Flag className="w-4 h-4" />
                    Campaign Flagged by Community
                  </div>
                  <p className="text-muted-foreground text-xs">
                    This campaign was paused after receiving {FLAG_THRESHOLD} community flags. Contributors can claim a full refund.
                  </p>
                </div>
              )}

              {/* ACTIVE + creator → Creator info banner */}
              {showCreatorActive && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm text-center space-y-2">
                  <p className="font-semibold text-primary">You created this campaign</p>
                  <p className="text-muted-foreground text-xs">
                    Funding is live. Once the goal is reached by the deadline, you can withdraw from your Dashboard.
                  </p>
                  {campaign.backersCount === 0 && (
                    <Button asChild variant="outline" size="sm" className="w-full mt-2">
                      <Link to={ROUTE_PATHS.EDIT_CAMPAIGN.replace(':id', campaign.id)}>
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Edit (before first contribution)
                      </Link>
                    </Button>
                  )}
                </div>
              )}

              {/* Not connected, campaign is active → prompt to connect */}
              {showConnectPrompt && (
                <ConnectPrompt
                  compact
                  message="Connect your wallet to contribute ETH and earn reward tokens."
                />
              )}

              {/* Campaign is FUNDED and user is not creator → funded banner */}
              {effectiveStatus === CAMPAIGN_STATUS.FUNDED && !isCreator && (
                <div className="rounded-lg bg-chart-2/10 border border-chart-2/30 p-4 text-sm text-center">
                  <p className="font-semibold text-chart-2">Campaign Successfully Funded</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    This campaign reached its goal. Reward tokens will be minted when the creator withdraws.
                  </p>
                </div>
              )}

              {/* Campaign is CANCELLED (not flagged) and user is not connected */}
              {effectiveStatus === CAMPAIGN_STATUS.CANCELLED && !isConnected && !isCreator && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-center">
                  <p className="font-semibold text-destructive">Campaign Cancelled</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    This campaign did not reach its funding goal by the deadline.
                  </p>
                </div>
              )}

              {/* Creator info — always shown */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full ring-2 ring-background flex items-center justify-center font-mono text-xs font-semibold"
                    style={{
                      // Deterministic color derived from the wallet address — stable per wallet.
                      background: `linear-gradient(135deg, #${campaign.creator.walletAddress.slice(2, 8)}, #${campaign.creator.walletAddress.slice(-6)})`,
                      color: '#fff',
                      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                    }}
                    aria-hidden
                  >
                    {campaign.creator.walletAddress.slice(2, 4).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Project by</p>
                    <p className="text-sm font-semibold font-mono truncate">
                      {campaign.creator.walletAddress.slice(0, 6)}…{campaign.creator.walletAddress.slice(-4)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Smart contract trust badge */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <TrendingUp className="w-3 h-3" />
                  Smart Contract Enforced
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  All funding, withdrawals, and refunds are executed automatically by audited smart contracts on-chain. No manual intervention possible.
                </p>
              </div>
              {/* Stats footer — travels with the sticky sidebar */}
              <div className="flex items-center justify-center gap-4 text-muted-foreground pt-4 mt-2 border-t border-border/40">
                <div className="flex items-center gap-1 text-[11px]">
                  <Target className="w-3 h-3" />
                  Verified
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <Users className="w-3 h-3" />
                  Community Led
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3" />
                  Active {new Date().getFullYear()}
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
