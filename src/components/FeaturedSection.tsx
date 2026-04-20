import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Star, ChevronRight } from 'lucide-react';
import { Campaign, ROUTE_PATHS } from '@/lib/index';
import { FeaturedData } from '@/hooks/useFeatured';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { staggerContainer, staggerItem } from '@/lib/motion';

const CATEGORY_GRADIENT: Record<string, string> = {
  'AI':           'from-violet-500/20 via-purple-500/10 to-transparent',
  'Web3':         'from-cyan-500/20 via-sky-500/10 to-transparent',
  'Tech':         'from-blue-500/20 via-indigo-500/10 to-transparent',
  'Fintech':      'from-emerald-500/20 via-green-500/10 to-transparent',
  'Healthcare':   'from-pink-500/20 via-rose-500/10 to-transparent',
  'Green Energy': 'from-lime-500/20 via-green-500/10 to-transparent',
};

const CATEGORY_ACCENT: Record<string, string> = {
  'AI':           'border-violet-500/30 shadow-violet-500/10',
  'Web3':         'border-cyan-500/30 shadow-cyan-500/10',
  'Tech':         'border-blue-500/30 shadow-blue-500/10',
  'Fintech':      'border-emerald-500/30 shadow-emerald-500/10',
  'Healthcare':   'border-pink-500/30 shadow-pink-500/10',
  'Green Energy': 'border-lime-500/30 shadow-lime-500/10',
};

const pct = (c: Campaign): number =>
  c.goalAmount > 0 ? Math.round((c.raisedAmount / c.goalAmount) * 100) : 0;

interface SpotlightCardProps {
  campaign:   Campaign;
  label:      string;
  labelIcon:  React.ReactNode;
  metric:     string;
  metricSub:  string;
  liveDot?:   boolean;
}

function SpotlightCard({ campaign, label, labelIcon, metric, metricSub, liveDot }: SpotlightCardProps) {
  const gradient = CATEGORY_GRADIENT[campaign.category] ?? 'from-primary/20 via-primary/5 to-transparent';
  const accent   = CATEGORY_ACCENT[campaign.category]   ?? 'border-primary/30 shadow-primary/10';

  return (
    <motion.div variants={staggerItem}>
      <Link
        to={ROUTE_PATHS.CAMPAIGN_DETAIL.replace(':id', campaign.id)}
        className={`group block relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-sm shadow-xl ${accent} transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />

        {campaign.imageUrl && (
          <div className="relative h-28 overflow-hidden">
            <img
              src={campaign.imageUrl}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/30 to-transparent" />
          </div>
        )}

        <div className="relative p-4">
          <div className="flex items-center gap-1.5 mb-3">
            {liveDot && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
            )}
            <span className="text-primary">{labelIcon}</span>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-primary/80">
              {label}
            </span>
          </div>

          <h3 className="text-base font-bold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
            {campaign.title}
          </h3>
          <p className="text-[12px] text-muted-foreground line-clamp-2 mb-3">
            {campaign.shortDescription}
          </p>

          <Progress value={Math.min(100, pct(campaign))} className="h-1 mb-2 bg-secondary/60" />

          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-black tabular-nums tracking-tight text-foreground">
                {metric}
              </span>
              <p className="text-[11px] text-muted-foreground">{metricSub}</p>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
              <span className="text-xs">View</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

interface FeaturedSectionProps {
  featured: FeaturedData;
}

export function FeaturedSection({ featured }: FeaturedSectionProps) {
  const { topFunded, risingFast, topCreatorCampaigns, categoryTop } = featured;

  if (!topFunded && !risingFast && topCreatorCampaigns.length === 0) return null;

  const categoryEntries = Object.entries(categoryTop).slice(0, 6);

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Spotlight</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Top performing campaigns right now
            </p>
          </div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
        >
          {topFunded && (
            <SpotlightCard
              campaign={topFunded}
              label="Top Funded"
              labelIcon={<Star className="w-3 h-3" />}
              metric={`${pct(topFunded)}%`}
              metricSub={`${topFunded.raisedAmount.toFixed(2)} ETH raised`}
            />
          )}
          {risingFast && risingFast.id !== topFunded?.id && (
            <SpotlightCard
              campaign={risingFast}
              label="Rising Fast"
              labelIcon={<Zap className="w-3 h-3" />}
              metric={`${risingFast.backersCount}`}
              metricSub="contributors and climbing"
              liveDot
            />
          )}
          {topCreatorCampaigns[0] && (
            <SpotlightCard
              campaign={topCreatorCampaigns[0]}
              label="Top Creator"
              labelIcon={<TrendingUp className="w-3 h-3" />}
              metric={`${topCreatorCampaigns.length}`}
              metricSub={`successful campaign${topCreatorCampaigns.length !== 1 ? 's' : ''} funded`}
            />
          )}
        </motion.div>

        {categoryEntries.length > 0 && (
          <>
            <h3 className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
              Top by Category
            </h3>
            <div className="flex flex-wrap gap-3">
              {categoryEntries.map(([category, campaign]) => (
                <Link
                  key={category}
                  to={ROUTE_PATHS.CAMPAIGN_DETAIL.replace(':id', campaign.id)}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl border bg-card/50 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${CATEGORY_ACCENT[category] ?? 'border-border'}`}
                >
                  <Badge variant="outline" className="text-[10px] border-current">
                    {category}
                  </Badge>
                  <span className="text-sm font-medium line-clamp-1 max-w-[180px] group-hover:text-primary transition-colors">
                    {campaign.title}
                  </span>
                  <span className="text-xs font-semibold text-primary tabular-nums ml-auto pl-2">
                    {pct(campaign)}%
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
