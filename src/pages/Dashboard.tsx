import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getStartupFund } from '@/lib/contracts';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Rocket,
  History,
  TrendingUp,
  ShieldCheck,
  Wallet,
  Gift,
  RefreshCw,
  UserPlus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  Pencil,
  Flag,
  Clock,
  Users,
  BarChart2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { ROUTE_PATHS, CAMPAIGN_STATUS } from '@/lib/index';
import { CampaignCard, StatsCard } from '@/components/Cards';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useWallet } from '@/hooks/useWallet';
import { useRegistration } from '@/hooks/useRegistration';
import { useContributorStats } from '@/hooks/useContributorStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

export default function Dashboard() {
  const { isConnected, address, balance, shortAddress, connect } = useWallet();
  const { isRegistered, isRegistering, register } = useRegistration();
  const { campaigns, isMockData } = useCampaigns();
  const {
    totalContributed,
    rewardTokens,
    transactions,
    txCount,
    campaignsBacked,
    refundedCampaigns,
    isLoading: statsLoading,
    refetch,
  } = useContributorStats();

  // ── Derived data ─────────────────────────────────────────────────────────────

  // Campaigns this user created (on-chain creator matches wallet address)
  const myCreatedCampaigns = useMemo(() => {
    if (!address) return [];
    return campaigns.filter(
      c => c.creator?.walletAddress?.toLowerCase() === address.toLowerCase()
    );
  }, [campaigns, address]);

  // Campaigns this user contributed to (from on-chain Funded events)
  const myBackedCampaigns = useMemo(() => {
    if (!address || campaignsBacked.size === 0) return [];
    return campaigns.filter(c => campaignsBacked.has(c.id));
  }, [campaigns, campaignsBacked, address]);

  // Campaigns eligible for refund:
  // - Business rule: campaign CANCELLED (goal not met by deadline) OR FLAGGED
  // - User must have contributed (in campaignsBacked)
  // - User must NOT have already claimed refund (not in refundedCampaigns)
  const refundableCampaigns = useMemo(() => {
    if (!address) return [];
    return campaigns.filter(c =>
      (c.status === CAMPAIGN_STATUS.CANCELLED || c.status === CAMPAIGN_STATUS.FLAGGED) &&
      campaignsBacked.has(c.id) &&
      !refundedCampaigns.has(c.id)
    );
  }, [campaigns, campaignsBacked, refundedCampaigns, address]);

  // Campaigns where user earned rewards:
  // - Business rule: campaign FUNDED, user contributed, user NOT refunded
  const rewardedCampaigns = useMemo(() => {
    if (!address || campaignsBacked.size === 0) return [];
    return campaigns.filter(c =>
      c.status === CAMPAIGN_STATUS.FUNDED &&
      campaignsBacked.has(c.id) &&
      !refundedCampaigns.has(c.id)
    );
  }, [campaigns, campaignsBacked, refundedCampaigns, address]);

  // Contribution amount per campaign (from transaction list)
  const contributionByCampaign = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(tx => tx.type === 'funding')
      .forEach(tx => {
        const eth = parseFloat(tx.amount.replace(' ETH', '')) || 0;
        map[tx.campaignId] = (map[tx.campaignId] || 0) + eth;
      });
    return map;
  }, [transactions]);

  // ── Refund handler ───────────────────────────────────────────────────────────
  const handleRefund = async (campaignId: string) => {
    if (!address) return;
    const contract = await getStartupFund(true);
    const tx = await contract.claimRefund(BigInt(campaignId));
    await tx.wait();
    window.dispatchEvent(new Event('sf:balance-refresh'));
    setTimeout(() => window.dispatchEvent(new Event('sf:stats-refresh')), 2500);
  };

  // ── Not connected ────────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Wallet Disconnected</h2>
          <p className="text-muted-foreground mb-8">
            Connect your MetaMask wallet to see your contributions, rewards, and campaign activity.
          </p>
          <Button onClick={connect} size="lg" className="w-full gap-2">
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Not registered ───────────────────────────────────────────────────────────
  if (!isRegistered) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl space-y-6"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Register Your Wallet</h2>
            <p className="text-muted-foreground text-sm">
              One-time on-chain registration required before investing or creating campaigns.
            </p>
            <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded-lg px-3 py-2">{address}</p>
          </div>
          <Button
            onClick={() => register(false)}
            disabled={isRegistering}
            size="lg"
            className="w-full gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {isRegistering ? 'Confirm in MetaMask…' : 'Register & Continue'}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8">

      {/* Header */}
      <motion.div
        {...fadeInUp}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
      >
        <div>
          <div className="flex items-center gap-2 text-primary mb-2 font-mono text-sm">
            <div className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
            CONNECTED: {shortAddress}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your contributions, rewards, and campaigns</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2" onClick={refetch}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            Verified
          </Button>
          <Button size="sm" className="gap-2" asChild>
            <Link to={ROUTE_PATHS.CREATE_CAMPAIGN}>
              <Rocket className="w-4 h-4" />
              Launch Campaign
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Demo mode banner */}
      {isMockData && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Demo mode</strong> — Ganache not detected. Stats show on-chain data only when contracts are reachable.
          </span>
        </motion.div>
      )}

      {/* ── Stats Grid ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
      >
        <StatsCard
          title="Total Contributed"
          value={statsLoading ? '…' : `${totalContributed} ETH`}
        />
        <StatsCard
          title="Rewards Earned"
          value={statsLoading ? '…' : `${rewardTokens} ETH`}
        />
        <StatsCard
          title="Campaigns Backed"
          value={statsLoading ? '…' : campaignsBacked.size.toString()}
        />
        <StatsCard
          title="Transactions"
          value={statsLoading ? '…' : (txCount !== null ? txCount.toString() : '0')}
        />
      </motion.div>

      {/* ── Tabs ───────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex">
          <TabsTrigger value="overview">
            <LayoutDashboard className="w-4 h-4 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <History className="w-4 h-4 mr-1.5" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Gift className="w-4 h-4 mr-1.5" />
            Rewards
            {rewardedCampaigns.length > 0 && (
              <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-chart-2 text-white">
                {rewardedCampaigns.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="refunds">
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refunds
            {refundableCampaigns.length > 0 && (
              <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-amber-500 text-white">
                {refundableCampaigns.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ══ OVERVIEW ════════════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-8">

          {/* Wallet card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Address</span>
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded select-all">{address}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-bold font-mono">{balance} ETH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Contributed</span>
                <span className="font-bold font-mono text-primary">
                  {statsLoading ? '…' : `${totalContributed} ETH`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Rewards Earned</span>
                <span className="font-bold font-mono text-chart-2">
                  {statsLoading ? '…' : `${rewardTokens} ETH`}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Roles</span>
                <div className="flex gap-1.5">
                  <Badge className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10">
                    <Rocket className="w-3 h-3 mr-1" />
                    Entrepreneur
                  </Badge>
                  <Badge className="bg-chart-2/10 text-chart-2 border border-chart-2/20 hover:bg-chart-2/10">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Contributor
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns I backed */}
          {myBackedCampaigns.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Campaigns I Backed
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBackedCampaigns.map(c => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            </section>
          )}

          {/* My created campaigns — entrepreneur analytics */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                My Campaigns
              </h2>
              <Button size="sm" asChild>
                <Link to={ROUTE_PATHS.CREATE_CAMPAIGN}><Rocket className="w-4 h-4 mr-1.5" />New Campaign</Link>
              </Button>
            </div>

            {myCreatedCampaigns.length > 0 ? (
              <div className="space-y-6">
                {/* Funding progress chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-primary" />
                      Funding Overview
                    </CardTitle>
                    <CardDescription>Raised vs Goal across your campaigns (ETH)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={myCreatedCampaigns.map(c => ({
                          name: c.title.length > 14 ? c.title.slice(0, 14) + '…' : c.title,
                          Raised: parseFloat(c.raisedAmount.toFixed(4)),
                          Goal:   parseFloat(c.goalAmount.toFixed(4)),
                          status: c.status,
                        }))}
                        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                      >
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit=" ETH" width={72} />
                        <Tooltip
                          formatter={(val: number, name: string) => [`${val} ETH`, name]}
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Goal"   fill="#e5e7eb" radius={[4,4,0,0]} />
                        <Bar dataKey="Raised" radius={[4,4,0,0]}>
                          {myCreatedCampaigns.map((c, i) => (
                            <Cell
                              key={i}
                              fill={
                                c.status === CAMPAIGN_STATUS.FUNDED   ? '#22c55e' :
                                c.status === CAMPAIGN_STATUS.FLAGGED  ? '#ef4444' :
                                c.status === CAMPAIGN_STATUS.CANCELLED? '#f97316' :
                                '#6366f1'
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#6366f1] inline-block"/>Active</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#22c55e] inline-block"/>Funded</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#f97316] inline-block"/>Cancelled</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#ef4444] inline-block"/>Flagged</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Per-campaign analytics cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myCreatedCampaigns.map(c => {
                    const pct      = Math.min(100, (c.raisedAmount / c.goalAmount) * 100);
                    const daysLeft = Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000));
                    const canEdit  = c.backersCount === 0 && c.status === CAMPAIGN_STATUS.ACTIVE;
                    return (
                      <Card key={c.id} className={`border ${
                        c.status === CAMPAIGN_STATUS.FUNDED   ? 'border-green-300 bg-green-50/30 dark:bg-green-950/10' :
                        c.status === CAMPAIGN_STATUS.FLAGGED  ? 'border-red-300 bg-red-50/30 dark:bg-red-950/10' :
                        c.status === CAMPAIGN_STATUS.CANCELLED? 'border-orange-300 bg-orange-50/30 dark:bg-orange-950/10' :
                        'border-border'
                      }`}>
                        <CardContent className="pt-4 pb-4 space-y-3">
                          {/* Title row */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                to={`/campaigns/${c.id}`}
                                className="font-semibold hover:text-primary transition-colors line-clamp-1"
                              >
                                {c.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${
                                    c.status === CAMPAIGN_STATUS.FUNDED   ? 'border-green-400 text-green-700' :
                                    c.status === CAMPAIGN_STATUS.FLAGGED  ? 'border-red-400 text-red-700' :
                                    c.status === CAMPAIGN_STATUS.CANCELLED? 'border-orange-400 text-orange-700' :
                                    'border-primary/40 text-primary'
                                  }`}
                                >
                                  {c.status.toUpperCase()}
                                </Badge>
                                {c.profitReturnRate != null && c.profitReturnRate > 0 && (
                                  <span className="text-[10px] text-chart-2 font-medium">
                                    {c.profitReturnRate}% return
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {canEdit && (
                                <Link to={ROUTE_PATHS.EDIT_CAMPAIGN.replace(':id', c.id)}>
                                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1">
                                    <Pencil className="w-3 h-3" />
                                    Edit
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Funding progress */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{c.raisedAmount.toFixed(4)} ETH raised</span>
                              <span className="font-semibold text-foreground">{pct.toFixed(1)}%</span>
                            </div>
                            <Progress
                              value={pct}
                              className="h-2"
                            />
                            <p className="text-[10px] text-muted-foreground text-right">
                              Goal: {c.goalAmount} ETH
                            </p>
                          </div>

                          {/* Key metrics row */}
                          <div className="grid grid-cols-3 gap-2 pt-1 border-t text-center">
                            <div>
                              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                                <Users className="w-3 h-3" />
                              </div>
                              <p className="text-sm font-bold">{c.backersCount}</p>
                              <p className="text-[10px] text-muted-foreground">Backers</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                                <Flag className="w-3 h-3" />
                              </div>
                              <p className={`text-sm font-bold ${c.status === CAMPAIGN_STATUS.FLAGGED ? 'text-red-500' : ''}`}>
                                {c.status === CAMPAIGN_STATUS.FLAGGED ? '≥5' : '—'}
                              </p>
                              <p className="text-[10px] text-muted-foreground">Flags</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                                <Clock className="w-3 h-3" />
                              </div>
                              <p className="text-sm font-bold">{daysLeft}</p>
                              <p className="text-[10px] text-muted-foreground">Days left</p>
                            </div>
                          </div>

                          {/* Profit return deadline */}
                          {c.profitReturnDeadline && (
                            <p className="text-[10px] text-muted-foreground border-t pt-2">
                              Profit return deadline: {new Date(c.profitReturnDeadline).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Rocket className="w-12 h-12 mb-4 opacity-20" />
                  <p className="mb-2">You haven't created any campaigns yet.</p>
                  <Button asChild variant="link">
                    <Link to={ROUTE_PATHS.CREATE_CAMPAIGN}>Create your first campaign</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>
        </TabsContent>

        {/* ══ TRANSACTIONS ════════════════════════════════════════════════════════ */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All your on-chain activity — contributions, refunds, and rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <History className="w-8 h-8 mb-3 opacity-30 animate-pulse" />
                  <p className="text-sm">Loading on-chain history…</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
                  <History className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-medium mb-1">No transactions yet</p>
                  <p className="text-sm">Invest in a campaign to get started.</p>
                  <Button asChild variant="link" className="mt-4">
                    <Link to={ROUTE_PATHS.CAMPAIGNS}>Browse campaigns</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {transactions.map((tx, i) => (
                    <div key={tx.txHash + tx.type + i} className="flex items-center justify-between py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'funding' ? 'bg-primary/10 text-primary' :
                          tx.type === 'refund'  ? 'bg-amber-500/10 text-amber-500' :
                                                  'bg-chart-2/10 text-chart-2'
                        }`}>
                          {tx.type === 'funding' ? <ArrowUpRight className="w-4 h-4" /> :
                           tx.type === 'refund'  ? <ArrowDownLeft className="w-4 h-4" /> :
                                                   <Gift          className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {tx.type === 'funding' ? 'Contribution' :
                             tx.type === 'refund'  ? 'Refund Claimed' :
                                                    'Reward Received'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Campaign #{tx.campaignId} &nbsp;·&nbsp;
                            <span className="font-mono">{tx.txHash.slice(0, 8)}…{tx.txHash.slice(-6)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold font-mono ${
                          tx.type === 'funding' ? 'text-destructive' : 'text-chart-2'
                        }`}>
                          {tx.type === 'funding' ? '−' : '+'}{tx.amount}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{tx.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ REWARDS ═════════════════════════════════════════════════════════════ */}
        <TabsContent value="rewards" className="space-y-6">

          {/* Total earned banner */}
          <Card className="border-chart-2/30 bg-chart-2/5">
            <CardContent className="pt-6 pb-6 text-center space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Total Rewards Earned
              </p>
              <p className="text-5xl font-bold font-mono text-chart-2">
                {statsLoading ? '…' : rewardTokens}
              </p>
              <p className="text-muted-foreground text-sm">ETH — sent automatically to your wallet</p>
            </CardContent>
          </Card>

          {/* Business rule explanation */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>How rewards work:</strong> When a campaign you backed reaches its goal, you receive
              reward ETH equal to your contribution (1:1). Rewards are minted on-chain before the creator
              can withdraw. Refunded contributors do <strong>not</strong> receive rewards.
            </AlertDescription>
          </Alert>

          {/* Per-campaign reward breakdown */}
          {rewardedCampaigns.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Rewards by Campaign
              </h3>
              {rewardedCampaigns.map(c => {
                const contributed = contributionByCampaign[c.id] || 0;
                return (
                  <Card key={c.id} className="border-chart-2/20">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Link
                            to={`/campaigns/${c.slug || c.id}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {c.title}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">Successfully funded ✓</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold font-mono text-chart-2">+{contributed.toFixed(4)} ETH</p>
                          <p className="text-xs text-muted-foreground">reward</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center text-muted-foreground">
                <Gift className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium mb-1">No rewards yet</p>
                <p className="text-sm max-w-sm">
                  Rewards appear here when a campaign you contributed to is successfully funded.
                  Invest in a campaign that reaches its goal to earn rewards.
                </p>
                <Button asChild variant="link" className="mt-4">
                  <Link to={ROUTE_PATHS.CAMPAIGNS}>Find campaigns to back</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══ REFUNDS ═════════════════════════════════════════════════════════════ */}
        <TabsContent value="refunds" className="space-y-6">

          {/* Business rule explanation */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Refund eligibility:</strong> You can claim a full refund when a campaign you backed
              fails to reach its goal by the deadline (status: CANCELLED), or is suspended by community
              vote (status: FLAGGED). Refunded contributors do not receive reward tokens.
            </AlertDescription>
          </Alert>

          {refundableCampaigns.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Available Refunds
              </h3>
              {refundableCampaigns.map(c => {
                const contributed = contributionByCampaign[c.id] || 0;
                const isMockCampaign = !/^\d+$/.test(c.id);
                return (
                  <Card key={c.id} className="border-amber-400/30">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <Link
                            to={`/campaigns/${c.slug || c.id}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {c.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={c.status === CAMPAIGN_STATUS.FLAGGED
                                ? 'text-red-600 border-red-300'
                                : 'text-amber-600 border-amber-300'}
                            >
                              {c.status.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Your contribution: <strong>{contributed.toFixed(4)} ETH</strong>
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-400 text-amber-700 hover:bg-amber-50 shrink-0"
                          disabled={isMockCampaign}
                          onClick={async () => {
                            if (isMockCampaign) return;
                            try { await handleRefund(c.id); }
                            catch (e) { console.error(e); }
                          }}
                        >
                          <ArrowDownLeft className="w-4 h-4 mr-1.5" />
                          {isMockCampaign ? 'Demo' : `Claim ${contributed.toFixed(4)} ETH`}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center text-muted-foreground">
                <RefreshCw className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium mb-1">No refunds available</p>
                <p className="text-sm max-w-sm">
                  Refunds appear here when a campaign you contributed to fails to reach its goal by
                  the deadline, or is flagged by the community.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Refund policy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Refund Policy</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">When you get a refund</h4>
                <ul className="space-y-1">
                  <li>• Campaign goal not met by deadline → CANCELLED</li>
                  <li>• Campaign flagged ≥5 times by community → FLAGGED</li>
                  <li>• Full ETH contribution returned</li>
                  <li>• No reward tokens issued to refunded contributors</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Process</h4>
                <ul className="space-y-1">
                  <li>• One refund claim per contributor per campaign</li>
                  <li>• Gas fee applies for the on-chain claim transaction</li>
                  <li>• Funds go directly to your MetaMask wallet</li>
                  <li>• Balance updates automatically after claim</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
