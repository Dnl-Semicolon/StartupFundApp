import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getStartupFund, ensureRegistered } from '@/lib/contracts';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Rocket,
  History,
  Coins,
  ExternalLink,
  TrendingUp,
  ShieldCheck,
  Wallet,
  Gift,
  RefreshCw,
  UserPlus,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { ROUTE_PATHS, CAMPAIGN_STATUS } from '@/lib/index';
import { CampaignCard, StatsCard } from '@/components/Cards';
import { RefundRequestForm } from '@/components/Forms';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useWallet } from '@/hooks/useWallet';
import { useUserRole } from '@/hooks/useUserRole';
import { useContributorStats } from '@/hooks/useContributorStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

export default function Dashboard() {
  const { isConnected, address, balance, shortAddress, connect } = useWallet();
  const { isRegistered, isContributor, isEntrepreneur, displayName } = useUserRole();
  const { campaigns, isMockData } = useCampaigns();
  const { totalContributed, rewardTokens, transactions, txCount, isLoading: statsLoading } = useContributorStats();

  const handleRefundSubmit = async (campaignId: string): Promise<void> => {
    if (!address) throw new Error('Wallet not connected');
    await ensureRegistered(address);
    const contract = await getStartupFund(true);
    const tx = await contract.claimRefund(BigInt(campaignId));
    await tx.wait();
  };

  // Campaigns created by the connected wallet (entrepreneurs)
  const myCreatedCampaigns = useMemo(() => {
    if (!address) return [];
    return campaigns.filter(
      c => c.creatorId.toLowerCase() === address.toLowerCase()
    );
  }, [campaigns, address]);

  // Cancelled campaigns visible to contributors for potential refund
  const cancelledCampaigns = useMemo(
    () => campaigns.filter(c => c.status === CAMPAIGN_STATUS.CANCELLED),
    [campaigns]
  );

  const activePlatformCampaigns = useMemo(
    () => campaigns.filter(c => c.status === CAMPAIGN_STATUS.ACTIVE).length,
    [campaigns]
  );

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

  // ── Connected but not registered ─────────────────────────────────────────────
  if (!isRegistered) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Registration Required</h2>
          <p className="text-muted-foreground mb-2">
            Your wallet is connected but you haven't registered yet.
          </p>
          <p className="text-xs text-muted-foreground font-mono mb-8 bg-muted/50 rounded-lg px-3 py-2">
            {address}
          </p>
          <Button asChild size="lg" className="w-full gap-2">
            <Link to={ROUTE_PATHS.REGISTER}>
              <UserPlus className="w-4 h-4" />
              Create Account
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Registered dashboard ─────────────────────────────────────────────────────
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Welcome back, {displayName || 'User'}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            {isEntrepreneur ? (
              <>
                <Badge variant="secondary" className="text-xs">Entrepreneur</Badge>
                <Badge variant="outline" className="text-xs">Contributor</Badge>
              </>
            ) : (
              <Badge variant="secondary" className="text-xs">Contributor</Badge>
            )}
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            Verified
          </Button>
          {isEntrepreneur && (
            <Button size="sm" className="gap-2" asChild>
              <Link to={ROUTE_PATHS.CREATE_CAMPAIGN}>
                <Rocket className="w-4 h-4" />
                Launch New Project
              </Link>
            </Button>
          )}
          {!isEntrepreneur && (
            <Button size="sm" variant="outline" className="gap-2" asChild>
              <Link to={ROUTE_PATHS.ENTREPRENEUR}>
                <Rocket className="w-4 h-4" />
                Become an Entrepreneur
              </Link>
            </Button>
          )}
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
        <StatsCard title="Reward Tokens" value={statsLoading ? '…' : `${rewardTokens} SFT`} />
        {isEntrepreneur
          ? <StatsCard title="My Active Ventures" value={myCreatedCampaigns.filter(c => c.status === CAMPAIGN_STATUS.ACTIVE).length.toString()} />
          : <StatsCard title="Active Campaigns" value={activePlatformCampaigns.toString()} />
        }
        <StatsCard title="Transactions" value={txCount !== null ? txCount.toString() : '--'} />
      </motion.div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className={`grid w-full ${isContributor ? 'grid-cols-4' : 'grid-cols-1'} md:w-auto md:inline-flex`}>
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </TabsTrigger>
          {isContributor && (
            <>
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
            </>
          )}
        </TabsList>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-10">

          {/* Entrepreneur: My Campaigns */}
          {isEntrepreneur && (
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
                    <CampaignCard key={campaign.id} campaign={campaign} />
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
          )}

          {/* Contributor: Active campaigns on platform */}
          {isContributor && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="text-primary w-6 h-6" />
                  Active Campaigns
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={ROUTE_PATHS.CAMPAIGNS}>Browse All</Link>
                </Button>
              </div>

              <Alert className="mb-6 bg-muted/50 border-border">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm text-muted-foreground">
                  Your personal contribution history will appear here once on-chain event indexing is connected.
                </AlertDescription>
              </Alert>

              {campaigns.filter(c => c.status === CAMPAIGN_STATUS.ACTIVE).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns
                    .filter(c => c.status === CAMPAIGN_STATUS.ACTIVE)
                    .slice(0, 3)
                    .map(campaign => (
                      <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                </div>
              ) : (
                <Card className="border-dashed flex flex-col items-center justify-center py-12 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">No active campaigns at the moment.</p>
                </Card>
              )}
            </section>
          )}

          {/* Wallet info card */}
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
                <span className="text-muted-foreground">Role</span>
                <div className="flex gap-1">
                  {isEntrepreneur && <Badge variant="secondary" className="text-xs">Entrepreneur</Badge>}
                  {isContributor  && <Badge variant="outline"   className="text-xs">Contributor</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Transactions (Contributor only) ──────────────────────────────── */}
        {isContributor && (
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
        )}

        {/* ── Rewards (Contributor only) ────────────────────────────────────── */}
        {isContributor && (
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
        )}

        {/* ── Refunds (Contributor only) ────────────────────────────────────── */}
        {isContributor && (
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
        )}
      </Tabs>
    </div>
  );
}
