import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Flag,
  Clock,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { Campaign, CAMPAIGN_STATUS, ROUTE_PATHS } from '@/lib/index';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
  campaign: Campaign;
}
//ewufgiuweqgfuqgeoufqeiugfiuwegiufgewuiefw
export function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  const isFlagged   = campaign.status === CAMPAIGN_STATUS.FLAGGED;
  const isPending   = campaign.status === CAMPAIGN_STATUS.PENDING;
  const isRejected  = campaign.status === CAMPAIGN_STATUS.REJECTED;
  const isCancelled = campaign.status === CAMPAIGN_STATUS.CANCELLED;
  const isFunded    = campaign.status === CAMPAIGN_STATUS.FUNDED;
  // Greyed = "shown but cannot/should-not engage". Funded shown distinctly so
  // backers still find it post-success but realise it's not fundable any more.
  const isGreyed    = isCancelled || isFlagged || isRejected || isFunded;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className={cn(
        "overflow-hidden border-border bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full",
        isFlagged   && "border-red-300 dark:border-red-800 opacity-60",
        isPending   && "border-amber-500/30 dark:border-amber-500/40",
        isRejected  && "border-red-500/30 dark:border-red-700 opacity-50",
        isCancelled && "border-orange-300 dark:border-orange-800 opacity-60",
        isFunded    && "border-emerald-400/40 dark:border-emerald-700",
      )}>
        <div className="relative aspect-video overflow-hidden">
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className={cn(
              "object-cover w-full h-full transition-transform duration-500 hover:scale-105",
              isGreyed  && !isFunded && "grayscale",
              isFunded  && "saturate-150",
              isPending && "saturate-75",
            )}
          />
          <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground backdrop-blur-sm">
            {campaign.category}
          </Badge>
          {isFlagged && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-red-600 text-white flex items-center gap-1 shadow-lg">
                <Flag className="w-3 h-3" />
                Flagged
              </Badge>
            </div>
          )}
          {isPending && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-amber-500 text-white flex items-center gap-1 shadow-lg">
                <Clock className="w-3 h-3" />
                Awaiting Vote
              </Badge>
            </div>
          )}
          {isRejected && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-red-700 text-white flex items-center gap-1 shadow-lg">
                <XCircle className="w-3 h-3" />
                Rejected
              </Badge>
            </div>
          )}
          {isCancelled && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-orange-600 text-white flex items-center gap-1 shadow-lg">
                <XCircle className="w-3 h-3" />
                Cancelled
              </Badge>
            </div>
          )}
          {isFunded && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-emerald-600 text-white flex items-center gap-1 shadow-lg">
                <CheckCircle2 className="w-3 h-3" />
                Funded
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="p-5 pb-0">
          {isFlagged && (
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md px-3 py-2 mb-2">
              <Flag className="w-3 h-3 shrink-0" />
              Suspended by community vote — contributors can claim a full refund.
            </div>
          )}
          {isPending && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 mb-2">
              <Clock className="w-3 h-3 shrink-0" />
              Awaiting community approval before it can receive contributions.
            </div>
          )}
          {isRejected && (
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md px-3 py-2 mb-2">
              <XCircle className="w-3 h-3 shrink-0" />
              Declined by community. Cannot accept contributions.
            </div>
          )}
          {isCancelled && (
            <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-md px-3 py-2 mb-2">
              <XCircle className="w-3 h-3 shrink-0" />
              Deadline passed without meeting goal. Backers refunded.
            </div>
          )}
          {isFunded && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-2 mb-2">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              Goal reached. Closed to new contributions.
            </div>
          )}
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-xl line-clamp-1 group-hover:text-primary transition-colors">
              {campaign.title}
            </h3>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2 min-h-[40px]">
            {campaign.shortDescription}
          </p>
        </CardHeader>

        <CardContent className="p-5 space-y-4 flex-grow">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className={isFlagged ? 'text-muted-foreground' : 'text-primary'}>{progress}% Raised</span>
              <span className="text-muted-foreground">{campaign.raisedAmount} / {campaign.goalAmount} ETH</span>
            </div>
            <Progress value={progress} className="h-2 bg-secondary" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4 text-primary/70" />
              <span>{campaign.backersCount} Backers</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary/70" />
              <span>{daysLeft} Days Left</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0 mt-auto">
          <Button
            asChild
            className="w-full group"
            variant={isFlagged || isRejected || isCancelled ? 'destructive' : 'outline'}
          >
            <Link to={ROUTE_PATHS.CAMPAIGN_DETAIL.replace(':id', campaign.id)}>
              {isFlagged   ? 'View & Claim Refund'
                : isPending   ? 'View & Track Vote'
                : isRejected  ? 'View Rejection'
                : isCancelled ? 'View & Claim Refund'
                : isFunded    ? 'View Funded Campaign'
                : 'View Campaign'}
              <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <Card className="border-none bg-secondary/30 backdrop-blur-sm hover:bg-secondary/50 transition-colors p-8 flex flex-col items-start gap-4">
      <div className="p-3 rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="space-y-2">
        <h4 className="text-xl font-bold">{title}</h4>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </Card>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  /** When true, render the value with a red strike-through line. Used to
   *  signal "campaign closed early" while still keeping the original
   *  countdown/value visible behind the slash. */
  strikethrough?: boolean;
}

export function StatsCard({ title, value, change, strikethrough = false }: StatsCardProps) {
  const isPositive = change?.startsWith('+');

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
      <CardContent className="p-6">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div className="flex items-baseline gap-3">
            <span className={cn(
              "text-3xl font-bold font-mono tracking-tight relative",
              strikethrough && "text-muted-foreground"
            )}>
              {value}
              {strikethrough && (
                <span className="absolute left-0 right-0 top-1/2 h-0.5 bg-destructive -rotate-3 origin-center" />
              )}
            </span>
            {change && (
              <div className={cn(
                "flex items-center text-xs font-semibold px-2 py-0.5 rounded-full",
                isPositive ? "text-chart-2 bg-chart-2/10" : "text-destructive bg-destructive/10"
              )}>
                {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {change}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
