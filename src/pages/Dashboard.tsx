import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getStartupFund, ensureRegistered } from '@/lib/contracts';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  LayoutDashboard,
  Rocket,
  History,
  Coins,
  TrendingUp,
  ShieldCheck,
  Wallet,
  Gift,
  RefreshCw,
  UserPlus,
  Info,
  AlertTriangle,
  Pencil,
  BarChart2,
} from 'lucide-react';
import { ROUTE_PATHS, CAMPAIGN_STATUS, Campaign } from '@/lib/index';
import { CampaignCard, StatsCard } from '@/components/Cards';
import { RefundRequestForm } from '@/components/Forms';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useWallet } from '@/hooks/useWallet';
import { useRegistration } from '@/hooks/useRegistration';
import { useContributorStats } from '@/hooks/useContributorStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

// ── Analytics helpers ─────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active:    '#6366f1',
  funded:    '#22c55e',
  cancelled: '#94a3b8',
  flagged:   '#ef4444',
};

function getRisk(campaign: Campaign): 'high' | 'medium' | 'low' | 'settled' {
  if (campaign.status !== CAMPAIGN_STATUS.ACTIVE) return 'settled';
  const daysLeft = Math.max(
    0,
    (new Date(campaign.deadline).getTime() - Date.now()) / 86_400_000
  );
  const pct = campaign.goalAmount > 0
    ? (campaign.raisedAmount / campaign.goalAmount) * 100
    : 0;
  if (daysLeft <= 7  && pct < 50) return 'high';
  if (daysLeft <= 14 && pct < 70) return 'medium';
  return 'low';
}

const RISK_STYLE = {
  high:    { label: 'High Risk',   cls: 'bg-red-500/10 text-red-600 border-red-300 dark:border-red-800 dark:text-red-400' },
  medium:  { label: 'Medium Risk', cls: 'bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-800 dark:text-amber-400' },
  low:     { label: 'On Track',    cls: 'bg-green-500/10 text-green-600 border-green-300 dark:border-green-800 dark:text-green-400' },
  settled: { label: 'Settled',     cls: 'bg-muted/50 text-muted-foreground border-border' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isConnected, address, balance, shortAddress, connect } = useWallet();
  const { isRegistered, isRegistering, register } = useRegistration();
  const { campaigns, isMockData } = useCampaigns();
  const { totalContributed, rewardTokens, transactions, txCount, isLoading: statsLoading } = useContributorStats();

  const handleRefundSubmit = async (campaignId: string): Promise<void> => {
    if (!address) throw new Error('Wallet not connected');
    await ensureRegistered(address);
    const contract = await getStartupFund(true);
    const tx = await contract.claimRefund(BigInt(campaignId));
    await tx.wait();
  };

  const myCreatedCampaigns = useMemo(() => {
    if (!address) return [];
    return campaigns.filter(
      c => c.creatorId.toLowerCase() === address.toLowerCase()
    );
  }, [campaigns, address]);

  const cancelledCampaigns = useMemo(
    () => campaigns.filter(c => c.status === CAMPAIGN_STATUS.CANCELLED),
    [campaigns]
  );

  // ── Analytics data ───────────────────────────────────────────────────────────

  const fundingData = useMemo(() =>
    myCreatedCampaigns.map(c => ({
      name: c.title.length > 16 ? c.title.slice(0, 16) + '…' : c.title,
      funded: Math.round((c.raisedAmount / c.goalAmount) * 100),
    })),
    [myCreatedCampaigns]
  );

  const contributorData = useMemo(() =>
    myCreatedCampaigns.map(c => ({
      name: c.title.length > 16 ? c.title.slice(0, 16) + '…' : c.title,
      contributors: c.backersCount,
    })),
    [myCreatedCampaigns]
  );

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    myCreatedCampaigns.forEach(c => {
      counts[c.status] = (counts[c.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [myCreatedCampaigns]);

  // ── Not connected ─────────────────────────────────────────────────────────────
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
            Connect your Web3 wallet to access your dashboard, manage campaigns, and track your reward tokens.
          </p>
          <Button onClick={connect} size="lg" className="w-full gap-2">
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

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
            <h2 className="text-2xl font-bold">Complete Setup</h2>
            <p className="text-muted-foreground text-sm">
              Your wallet is connected but account setup isn't complete.
            </p>
            <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded-lg px-3 py-2">{address}</p>
          </div>
          <Button onClick={() => register(false)} disabled={isRegistering} size="lg" className="w-full gap-2">
            <UserPlus className="w-4 h-4" />
            {isRegistering ? 'Confirm in MetaMask…' : 'Complete Setup'}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────────
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
          <p className="text-muted-foreground mt-1 text-sm">Your campaigns and contributions</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            Verified
          </Button>
          <Button size="sm" className="gap-2" asChild>
            <Link to={ROUTE_PATHS.CREATE_CAMPAIGN}>
              <Rocket className="w-4 h-4" />
              Launch New Campaign
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
            <span className="font-semibold">Demo mode</span> — Smart contracts not detected on Ganache.
            Deploy your contracts in Remix and update{' '}
            <code className="font-mono text-xs bg-amber-500/20 px-1.5 py-0.5 rounded">
              src/lib/contractAddresses.ts
            </code>{' '}
            to enable live blockchain interactions.
          </span>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
      >
        <StatsCard title="Total Contributed" value={statsLoading ? '…' : `${totalContributed} ETH`} />
        <StatsCard title="Reward Tokens"     value={statsLoading ? '…' : `${rewardTokens} SFT`} />
        <StatsCard title="My Campaigns"      value={myCreatedCampaigns.length.toString()} />
        <StatsCard title="Transactions"      value={txCount !== null ? txCount.toString() : '--'} />
      </motion.div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full grid-cols-5 md:w-auto md:inline-flex">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart2 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2">
            <Gift className="w-4 h-4" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="refunds" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refunds
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-10">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Rocket className="text-primary w-6 h-6" />
                My Campaigns
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to={ROUTE_PATHS.CREATE_CAMPAIGN}>+ New Campaign</Link>
              </Button>
            </div>
            {myCreatedCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCreatedCampaigns.map(campaign => (
                  <div key={campaign.id} className="flex flex-col gap-2">
                    <CampaignCard campaign={campaign} />
                    {campaign.status === CAMPAIGN_STATUS.ACTIVE && campaign.backersCount === 0 && (
                      <Button variant="outline" size="sm" className="gap-2 w-full" asChild>
                        <Link to={`/campaigns/${campaign.id}/edit`}>
                          <Pencil className="w-3.5 h-3.5" />
                          Edit Campaign
                        </Link>
                      </Button>
                    )}
                    {campaign.status === CAMPAIGN_STATUS.ACTIVE && campaign.backersCount > 0 && (
                      <p className="text-xs text-center text-muted-foreground">
                        Locked — {campaign.backersCount} contributor{campaign.backersCount > 1 ? 's' : ''} have funded
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border-dashed flex flex-col items-center justify-center py-12 text-center">
                <Rocket className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground mb-2">You haven't launched any campaigns yet.</p>
                <Button asChild variant="link" className="text-primary">
                  <Link to={ROUTE_PATHS.CREATE_CAMPAIGN}>Create your first campaign</Link>
                </Button>
              </Card>
            )}
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Wallet Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Address</span>
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{address}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-bold font-mono">{balance} ETH</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary" className="text-xs">Member</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Analytics ────────────────────────────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-8">
          {myCreatedCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <BarChart2 className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium mb-1">No analytics yet</p>
                <p className="text-sm max-w-sm">Create your first campaign to start seeing funding trends and risk indicators.</p>
                <Button asChild variant="link" className="mt-4 text-primary">
                  <Link to={ROUTE_PATHS.CREATE_CAMPAIGN}>Launch a campaign</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Funding Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Funding Progress
                  </CardTitle>
                  <CardDescription>% of goal reached per campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(120, myCreatedCampaigns.length * 52)}>
                    <BarChart data={fundingData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                      <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => [`${v}%`, 'Funded']} />
                      <Bar dataKey="funded" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={28}>
                        {fundingData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.funded >= 100 ? '#22c55e' : entry.funded >= 50 ? '#6366f1' : '#f59e0b'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Contributors + Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contributor Count</CardTitle>
                    <CardDescription>Unique backers per campaign</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={contributorData} margin={{ left: 0, right: 8, top: 4, bottom: 40 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" interval={0} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [v, 'Contributors']} />
                        <Bar dataKey="contributors" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Campaign Status</CardTitle>
                    <CardDescription>Distribution across all your campaigns</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, value }) => `${name} (${value})`}
                            labelLine={false}
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground">No data</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Risk Matrix */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Risk Assessment
                  </CardTitle>
                  <CardDescription>
                    Calculated from funding % vs days remaining — active campaigns only
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myCreatedCampaigns.map(campaign => {
                    const risk = getRisk(campaign);
                    const style = RISK_STYLE[risk];
                    const daysLeft = Math.max(
                      0,
                      Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / 86_400_000)
                    );
                    const pct = campaign.goalAmount > 0
                      ? Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)
                      : 0;
                    return (
                      <div
                        key={campaign.id}
                        className={`rounded-lg border p-4 ${style.cls}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{campaign.title}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs opacity-80">
                              <span>{pct}% funded</span>
                              <span>·</span>
                              {risk === 'settled'
                                ? <span className="capitalize">{campaign.status}</span>
                                : <span>{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
                              }
                              <span>·</span>
                              <span>{campaign.backersCount} backer{campaign.backersCount !== 1 ? 's' : ''}</span>
                            </div>
                            {risk !== 'settled' && (
                              <Progress value={pct} className="mt-2 h-1.5 opacity-60" />
                            )}
                          </div>
                          <Badge variant="outline" className={`shrink-0 text-xs border-current ${style.cls}`}>
                            {style.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Transactions ──────────────────────────────────────────────────── */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your on-chain activity — contributions, refunds, and reward tokens</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <History className="w-8 h-8 mb-3 opacity-30 animate-pulse" />
                  <p className="text-sm">Loading on-chain history…</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <History className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-medium mb-1">No transactions yet</p>
                  <p className="text-sm max-w-sm">Fund a campaign to get started.</p>
                  <Button asChild variant="link" className="mt-4 text-primary">
                    <Link to={ROUTE_PATHS.CAMPAIGNS}>Browse campaigns</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {transactions.map(tx => (
                    <div key={tx.txHash + tx.type} className="flex items-center justify-between py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'funding' ? 'bg-primary/10 text-primary' :
                          tx.type === 'refund'  ? 'bg-amber-500/10 text-amber-500' :
                                                 'bg-chart-2/10 text-chart-2'
                        }`}>
                          {tx.type === 'funding' ? <TrendingUp className="w-4 h-4" /> :
                           tx.type === 'refund'  ? <RefreshCw   className="w-4 h-4" /> :
                                                  <Coins        className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {tx.type === 'funding' ? 'Funded' : tx.type === 'refund' ? 'Refund' : 'Reward tokens'} — Campaign #{tx.campaignId}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {tx.txHash.slice(0, 10)}…{tx.txHash.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={tx.type === 'refund' ? 'outline' : 'secondary'}>
                        {tx.type === 'refund' ? '+' : tx.type === 'tokens' ? '+' : '-'}{tx.amount}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Rewards ───────────────────────────────────────────────────────── */}
        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                Reward Tokens
              </CardTitle>
              <CardDescription>
                ERC-20 tokens earned from successful campaigns — 1 token per 1 ETH contributed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rewardTokens !== '--' && rewardTokens !== '0' ? (
                <div className="text-center py-8">
                  <p className="text-5xl font-bold font-mono text-primary">{rewardTokens}</p>
                  <p className="text-muted-foreground mt-2">SFT tokens earned</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Gift className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-medium mb-1">No reward tokens yet</p>
                  <p className="text-sm max-w-sm">
                    Tokens are minted automatically when a campaign you contributed to is successfully funded and the creator withdraws.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Alert className="bg-muted/50 border-border">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Reward tokens are non-transferable claims on campaign success. Refunded contributors do not receive tokens. Tokens are minted before the creator can withdraw funds.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* ── Refunds ───────────────────────────────────────────────────────── */}
        <TabsContent value="refunds" className="space-y-6">
          {cancelledCampaigns.length > 0 ? (
            <>
              <Alert className="bg-muted/50 border-border">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  The following campaigns did not reach their funding goal. If you contributed, you can claim a full refund directly from the smart contract.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {cancelledCampaigns.map(campaign => (
                  <RefundRequestForm
                    key={campaign.id}
                    campaignId={campaign.id}
                    contributionAmount={0}
                    onSubmit={() => handleRefundSubmit(campaign.id)}
                  />
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <RefreshCw className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium mb-1">No refunds available</p>
                <p className="text-sm max-w-sm">
                  Refunds appear here when a campaign you contributed to fails to reach its goal by the deadline.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Refund Policy</CardTitle>
              <CardDescription>How automatic refunds work on StartupFund</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Conditions</h4>
                <ul className="space-y-1">
                  <li>• Campaign fails to reach funding goal by deadline</li>
                  <li>• Smart contract automatically marks campaign as CANCELLED</li>
                  <li>• Full contribution amount is returned</li>
                  <li>• Refunded contributors do not receive reward tokens</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Process</h4>
                <ul className="space-y-1">
                  <li>• Refunds available immediately after campaign failure</li>
                  <li>• Gas fees apply for the refund transaction</li>
                  <li>• One refund claim per contributor per campaign</li>
                  <li>• Funds transferred directly to your wallet</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
