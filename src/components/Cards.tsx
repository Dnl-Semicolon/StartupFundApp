import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Target, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import { Campaign, ROUTE_PATHS } from '@/lib/index';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={campaign.imageUrl} 
            alt={campaign.title} 
            className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
          />
          <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground backdrop-blur-sm">
            {campaign.category}
          </Badge>
        </div>

        <CardHeader className="p-5 pb-0">
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
              <span className="text-primary">{progress}% Raised</span>
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
          <Button asChild className="w-full group" variant="outline">
            <Link to={ROUTE_PATHS.CAMPAIGN_DETAIL.replace(':id', campaign.id)}>
              View Campaign
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
}

export function StatsCard({ title, value, change }: StatsCardProps) {
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
            <span className="text-3xl font-bold font-mono tracking-tight">{value}</span>
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
