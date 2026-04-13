import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  ROUTE_PATHS, 
  Campaign, 
  CAMPAIGN_STATUS 
} from '@/lib/index';
import { mockCampaigns } from '@/data/index';
import { StatsCard } from '@/components/Cards';
import { FundCampaignForm, WithdrawForm } from '@/components/Forms';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { springPresets, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  
  const campaign = useMemo(() => {
    return mockCampaigns.find(c => c.id === id || c.slug === id);
  }, [id]);

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
  const isCreator = false; // Mocking current user context
  
  const daysLeft = useMemo(() => {
    const now = new Date('2026-02-13T06:26:06Z');
    const deadline = new Date(campaign.deadline);
    const diff = deadline.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [campaign.deadline]);

  const handleFundingSubmit = (amount: number) => {
    console.log(`Funding ${amount} to ${campaign.title}`);
  };

  const handleWithdrawSubmit = () => {
    console.log(`Withdrawing funds for ${campaign.title}`);
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
                  className={campaign.status === CAMPAIGN_STATUS.ACTIVE ? 'bg-chart-2 text-white' : 'bg-muted text-muted-foreground'}
                >
                  {campaign.status.toUpperCase()}
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
          <Card className="sticky top-24 border-2 border-primary/10 shadow-xl">
            <CardHeader>
              <CardTitle>Back this project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <FundCampaignForm 
                campaignId={campaign.id} 
                onSubmit={handleFundingSubmit} 
              />

              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 ring-2 ring-background">
                    <AvatarImage src={campaign.creator.avatar} />
                    <AvatarFallback>{campaign.creator.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Project by</p>
                    <p className="text-sm font-semibold">{campaign.creator.name}</p>
                  </div>
                  <Link to={`/user/${campaign.creatorId}`} className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                  {campaign.creator.bio}
                </p>
              </div>

              {isCreator && campaign.status === CAMPAIGN_STATUS.FUNDED && (
                <div className="pt-4 border-t border-border">
                  <WithdrawForm 
                    campaignId={campaign.id} 
                    onSubmit={handleWithdrawSubmit} 
                  />
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <TrendingUp className="w-3 h-3" />
                  Market Insight
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Institutional interest in {campaign.category} projects has increased by 14% this quarter. This project aligns with current Web3 infrastructure trends.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1 text-xs">
              <Target className="w-3 h-3" />
              Verified
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Users className="w-3 h-3" />
              Community Led
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              Active 2026
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
