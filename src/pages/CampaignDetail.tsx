import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { parseEther } from 'ethers';
import { getStartupFund, getReadContract, ensureRegistered, STARTUPFUND_ABI } from '@/lib/contracts';
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
import { toast } from 'sonner';
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
  const { contributors } = useContributors(campaign);
  const myAddr = connectedAddress?.toLowerCase();
  const contribution = myAddr
    ? contributors.find(c => c.address.toLowerCase() === myAddr)?.amount ?? 0
    : 0;
  return (
    <RefundRequestForm
      campaignId={campaign.id}
      contributionAmount={contribution}
      onSubmit={onSubmit}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OverdueReclaimBanner
// Surfaced to contributors when a FUNDED campaign has blown past its
// profitReturnDeadline without the creator running Disburse. Records a reclaim
// intent in demoState for the creator to honour (demo-only, no ETH moves here).
// ─────────────────────────────────────────────────────────────────────────────
function OverdueReclaimBanner({
  campaign, isCreator, connectedAddress,
}: {
  campaign: Campaign;
  isCreator: boolean;
  connectedAddress: string | null;
}) {
  const { contributors } = useContributors(campaign);
  const over = getOverride(campaign.id);
  const isFunded   = campaign.status === CAMPAIGN_STATUS.FUNDED;
  const isDisbursed = !!over?.disbursedAt;
  const deadlineISO = campaign.profitReturnDeadline;
  const overdue = !!deadlineISO && new Date(deadlineISO).getTime() < Date.now();
  const myAddr = connectedAddress?.toLowerCase();
  const myEntry = myAddr
    ? contributors.find(c => c.address.toLowerCase() === myAddr)
    : undefined;
  const alreadyReclaimed = myAddr
    ? !!(over?.reclaimed && over.reclaimed[myAddr] !== undefined)
    : false;

  if (!isFunded || isDisbursed || !overdue || isCreator || !myEntry) return null;

  return (
    <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 space-y-2">
      <p className="font-semibold text-red-400 text-sm flex items-center gap-1.5">
        <XCircle className="w-4 h-4" /> Disbursement Overdue
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Creator promised payout by{' '}
        <span className="font-medium text-foreground">
          {deadlineISO ? new Date(deadlineISO).toLocaleDateString() : ''}
        </span>
        . You may request to reclaim your original {myEntry.amount.toFixed(4)} ETH contribution.
      </p>
      {alreadyReclaimed ? (
        <Badge variant="outline" className="border-amber-500/40 text-amber-400">
          Reclaim requested
        </Badge>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10"
          onClick={() => {
            recordReclaim(campaign.id, myAddr!, myEntry.amount);
            toast.success('Reclaim request recorded. Creator will be notified.');
          }}
        >
          Request Reclaim of {myEntry.amount.toFixed(4)} ETH
        </Button>
      )}
    </div>
  );
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected } = useWallet();
  const { isRegistered } = useRegistration();
  const { campaigns, loading: campaignsLoading } = useCampaigns();

  const campaign = useMemo(() => {
    return campaigns.find(c => c.id === id || c.slug === id);
  }, [campaigns, id]);

  // All hooks must be called unconditionally — before any early returns
  const daysLeft = useMemo(() => {
    if (!campaign) return 0;
    const now = new Date();
    const deadline = new Date(campaign.deadline);
    const diff = deadline.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [campaign]);

  // ── Flag state ────────────────────────────────────────────────────────────
  const FLAG_THRESHOLD = 5;

  const [flagCount,        setFlagCount]        = useState(0);
  const [hasAlreadyFlagged, setHasAlreadyFlagged] = useState(false);
  // demo mode only: campaign reached threshold → treat as FLAGGED status
  const [demoFlagged,      setDemoFlagged]      = useState(false);

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
  const showFundForm     = canAct && !isCreator && effectiveStatus === CAMPAIGN_STATUS.ACTIVE && daysLeft > 0;
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
    await tx.wait();
  };

  const handleWithdrawSubmit = async (): Promise<void> => {
    if (!address) throw new Error('Wallet not connected');
    const contract = await getStartupFund(true);
    const tx = await contract.withdraw(BigInt(campaign.id));
    await tx.wait();
  };

  const handleRefundSubmit = async (): Promise<void> => {
    if (!address) throw new Error('Wallet not connected');
    const contract = await getStartupFund(true);
    const tx = await contract.claimRefund(BigInt(campaign.id));
    await tx.wait();
  };

  const handleFlagSubmit = async (): Promise<void> => {
    if (!address) throw new Error('Wallet not connected');

    const isDemo = !/^\d+$/.test(campaign.id);

    if (isDemo) {
      // Demo mode — persist to localStorage
      const raw = localStorage.getItem(demoFlaggKey(campaign.id));
      const flaggers: string[] = raw ? JSON.parse(raw) : [];
      if (!flaggers.includes(address.toLowerCase())) {
        flaggers.push(address.toLowerCase());
        localStorage.setItem(demoFlaggKey(campaign.id), JSON.stringify(flaggers));
      }
      setFlagCount(flaggers.length);
      setHasAlreadyFlagged(true);
      if (flaggers.length >= FLAG_THRESHOLD) {
        localStorage.setItem(demoFlaggdKey(campaign.id), 'true');
        setDemoFlagged(true);
      }
      return;
    }

    // Real mode — on-chain tx
    await ensureRegistered(address);
    const contract = await getStartupFund(true);
    const tx = await contract.flagCampaign(BigInt(campaign.id));
    await tx.wait();
    setFlagCount(prev => prev + 1);
    setHasAlreadyFlagged(true);
  };

  const handleUnflagSubmit = async (): Promise<void> => {
    if (!address) throw new Error('Wallet not connected');

    const isDemo = !/^\d+$/.test(campaign.id);

    if (isDemo) {
      // Demo mode — remove from localStorage
      const raw = localStorage.getItem(demoFlaggKey(campaign.id));
      const flaggers: string[] = raw ? JSON.parse(raw) : [];
      const updated = flaggers.filter(a => a !== address.toLowerCase());
      localStorage.setItem(demoFlaggKey(campaign.id), JSON.stringify(updated));
      setFlagCount(updated.length);
      setHasAlreadyFlagged(false);
      return;
    }

    // Real mode — on-chain tx
    await ensureRegistered(address);
    const contract = await getStartupFund(true);
    const tx = await contract.unflagCampaign(BigInt(campaign.id));
    await tx.wait();
    setFlagCount(prev => Math.max(0, prev - 1));
    setHasAlreadyFlagged(false);
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
                title="Days Left"
                value={daysLeft.toString()}
              />
            </div>
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

              {/* FUNDED + creator → Withdraw OR Disburse (depending on demo overlay) */}
              {showWithdrawForm && !getOverride(campaign.id)?.disbursedAt && (
                <>
                  <WithdrawForm
                    campaignId={campaign.id}
                    onSubmit={handleWithdrawSubmit}
                  />
                  <div className="pt-4 mt-4 border-t border-border/40">
                    <DisburseProfitsForm campaign={campaign} />
                  </div>
                </>
              )}
              {showWithdrawForm && getOverride(campaign.id)?.disbursedAt && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-center space-y-1">
                  <p className="font-semibold text-emerald-400">Profits Disbursed</p>
                  <p className="text-muted-foreground text-xs">
                    Contributors have received their payouts via direct transfer.
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

              {/* FUNDED + past profit-return deadline + not disbursed →
                  contributors may reclaim their original. */}
              <OverdueReclaimBanner
                campaign={campaign}
                isCreator={isCreator}
                connectedAddress={address}
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
