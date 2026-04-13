import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Rocket, 
  History, 
  Coins, 
  ExternalLink, 
  ArrowUpRight, 
  TrendingUp,
  ShieldCheck,
  Wallet,
  Gift,
  RefreshCw,
  Settings
} from 'lucide-react';
import { 
  ROUTE_PATHS, 
  Campaign, 
  Contribution, 
  CAMPAIGN_STATUS 
} from '@/lib/index';
import { CampaignCard, StatsCard } from '@/components/Cards';
import { 
  RefundRequestForm, 
  RewardTokenForm, 
  UserRegistrationForm 
} from '@/components/Forms';
import { 
  TransactionHistory, 
  TransactionSummary, 
  Transaction 
} from '@/components/TransactionHistory';
import { mockCampaigns, mockTransactions, mockUsers } from '@/data/index';
import { useWallet } from '@/hooks/useWallet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IMAGES } from '@/assets/images';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

export default function Dashboard() {
  const { isConnected, address, balance, shortAddress, connect } = useWallet();

  // Find current mock user based on wallet address
  const currentUser = useMemo(() => {
    if (!address) return null;
    return mockUsers.find(u => u.walletAddress.toLowerCase() === address.toLowerCase()) || mockUsers[2];
  }, [address]);

  // Filter campaigns created by user (Simulated for u1/Alex Rivera)
  const myCreatedCampaigns = useMemo(() => {
    if (!currentUser) return [];
    return mockCampaigns.filter(c => c.creatorId === currentUser.id);
  }, [currentUser]);

  // Filter transactions by user and convert to Transaction format
  const myTransactions = useMemo(() => {
    if (!address) return [];
    // Convert mock transactions to Transaction format
    const filtered = mockTransactions.filter(tx => tx.contributorId === currentUser?.id);
    const transactions = (filtered.length > 0 ? filtered : mockTransactions).map(tx => ({
      id: tx.id,
      type: 'contribution' as const,
      amount: tx.amount,
      currency: tx.currency as 'ETH' | 'USDC',
      campaignId: tx.campaignId,
      campaignTitle: tx.campaignTitle,
      status: tx.status as 'pending' | 'confirmed' | 'failed',
      timestamp: new Date(tx.timestamp),
      txHash: tx.transactionHash,
      gasUsed: Math.floor(Math.random() * 50000) + 21000,
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000
    }));
    
    // Add some mock refund and reward transactions
    const additionalTx: Transaction[] = [
      {
        id: 'refund-1',
        type: 'refund',
        amount: 0.5,
        currency: 'ETH',
        campaignId: 'c4',
        campaignTitle: 'Failed Campaign Example',
        status: 'confirmed',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        txHash: '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef',
        gasUsed: 25000,
        blockNumber: 18500000
      },
      {
        id: 'token-1',
        type: 'token_mint',
        amount: 100,
        currency: 'ETH',
        campaignId: 'c1',
        campaignTitle: 'NeuroLink AI',
        status: 'confirmed',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        gasUsed: 45000,
        blockNumber: 18600000
      }
    ];
    
    return [...transactions, ...additionalTx];
  }, [address, currentUser]);

  // Calculate Stats
  const stats = useMemo(() => {
    const totalInvested = myTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    const rewardTokens = myTransactions.length * 100; // Mock calculation
    return {
      totalInvested: `${totalInvested.toFixed(2)} ETH`,
      activeCampaigns: myCreatedCampaigns.filter(c => c.status === CAMPAIGN_STATUS.ACTIVE).length,
      tokens: `${rewardTokens.toLocaleString()} SFG`,
      txCount: myTransactions.length
    };
  }, [myTransactions, myCreatedCampaigns]);

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
            Connect your Web3 wallet to access your investment dashboard, manage campaigns, and track your reward tokens.
          </p>
          <Button onClick={connect} size="lg" className="w-full gap-2">
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
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
            Welcome back, {currentUser?.name || 'Investor'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Managing {currentUser?.role === 'entrepreneur' ? 'your ventures' : 'your portfolio'} on StartupFund.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            Verified
          </Button>
          {currentUser?.role === 'entrepreneur' && (
            <Button className="gap-2" onClick={() => window.location.href = ROUTE_PATHS.CREATE_CAMPAIGN}>
              <Rocket className="w-4 h-4" />
              Launch New Project
            </Button>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
      >
        <StatsCard 
          title="Total Invested" 
          value={stats.totalInvested} 
          change="+12% this month" 
        />
        <StatsCard 
          title="Reward Tokens" 
          value={stats.tokens} 
          change="Staking active" 
        />
        <StatsCard 
          title="Active Ventures" 
          value={stats.activeCampaigns.toString()} 
        />
        <StatsCard 
          title="Transactions" 
          value={stats.txCount.toString()} 
        />
      </motion.div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Overview
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

        <TabsContent value="overview" className="space-y-10">
          {/* My Campaigns Section (For Entrepreneurs) */}
          {currentUser?.role === 'entrepreneur' && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Rocket className="text-primary w-6 h-6" />
                  My Campaigns
                </h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCreatedCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
                {myCreatedCampaigns.length === 0 && (
                  <Card className="col-span-full border-dashed flex flex-col items-center justify-center py-12 text-center">
                    <Rocket className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                    <p className="text-muted-foreground">You haven't launched any campaigns yet.</p>
                    <Button variant="link" className="text-primary">Create your first campaign</Button>
                  </Card>
                )}
              </div>
            </section>
          )}

          {/* Portfolio & Rewards Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Investment Portfolio</CardTitle>
                  <CardDescription>Performance of your backed startups.</CardDescription>
                </div>
                <TrendingUp className="text-chart-2 w-5 h-5" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockCampaigns.slice(0, 3).map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden">
                          <img src={campaign.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold group-hover:text-primary transition-colors cursor-pointer">{campaign.title}</p>
                          <p className="text-xs text-muted-foreground">{campaign.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium">0.45 ETH</p>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Coins className="w-32 h-32" />
              </div>
              <CardHeader>
                <CardTitle className="text-white">Reward Center</CardTitle>
                <CardDescription className="text-primary-foreground/70">Claim your SFG governance tokens.</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold mb-2">{stats.tokens}</div>
                <p className="text-sm text-primary-foreground/80 mb-6">Available to claim from 4 campaigns</p>
                <Button variant="secondary" className="w-full shadow-lg">
                  Claim Rewards
                </Button>
                <div className="mt-6 pt-6 border-t border-primary-foreground/20">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Next Unlock</span>
                    <span>7 Days</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <TransactionSummary transactions={myTransactions} />
          <TransactionHistory transactions={myTransactions} />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RewardTokenForm 
              campaignId="c1"
              tokenAmount={150}
              tokenSymbol="SFG"
              onClaim={() => console.log('Claiming reward tokens...')}
            />
            <RewardTokenForm 
              campaignId="c2"
              tokenAmount={75}
              tokenSymbol="SFG"
              onClaim={() => console.log('Claiming reward tokens...')}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Reward Token Portfolio</CardTitle>
              <CardDescription>Your earned tokens from successful campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">StartupFund Governance (SFG)</p>
                    <p className="text-sm text-muted-foreground">Platform governance token</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold font-mono">1,250 SFG</p>
                    <p className="text-sm text-muted-foreground">≈ $125.00</p>
                  </div>
                </div>
                
                <Alert>
                  <Coins className="h-4 w-4" />
                  <AlertDescription>
                    Reward tokens represent your stake in funded projects and may include voting rights, profit sharing, or other benefits as defined by each campaign.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RefundRequestForm 
              campaignId="c4"
              contributionAmount={0.5}
              onSubmit={() => console.log('Processing refund...')}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Refund Policy</CardTitle>
              <CardDescription>How automatic refunds work on StartupFund</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Automatic Refund Conditions</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Campaign fails to reach funding goal by deadline</li>
                    <li>• Smart contract automatically triggers refund process</li>
                    <li>• No manual intervention required</li>
                    <li>• Full contribution amount returned</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Refund Timeline</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Refunds available immediately after campaign failure</li>
                    <li>• Gas fees apply for refund transactions</li>
                    <li>• Refunds processed directly to your wallet</li>
                    <li>• No platform fees deducted</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
