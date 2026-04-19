import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, ArrowUpDown, LayoutGrid, Loader2, AlertTriangle } from 'lucide-react';
import { Campaign, CAMPAIGN_STATUS, ROUTE_PATHS } from '@/lib/index';
import { CampaignCard } from '@/components/Cards';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { springPresets, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';

const CATEGORIES = ['All', 'Tech', 'Fintech', 'Healthcare', 'Green Energy', 'AI', 'Web3'];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Ending Soon', value: 'deadline' },
  { label: 'Highest Goal', value: 'goal_high' },
  { label: 'Most Funded', value: 'raised_high' },
];

export default function Campaigns() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const { campaigns, loading, error, isMockData } = useCampaigns();

  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter((campaign) => {
        const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          campaign.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || campaign.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        // Always push flagged campaigns to the bottom regardless of sort
        const aFlagged = a.status === CAMPAIGN_STATUS.FLAGGED ? 1 : 0;
        const bFlagged = b.status === CAMPAIGN_STATUS.FLAGGED ? 1 : 0;
        if (aFlagged !== bFlagged) return aFlagged - bFlagged;

        switch (sortBy) {
          case 'newest':
            // No createdAt on chain — sort by id descending (insertion order)
            return Number(b.id) - Number(a.id);
          case 'deadline':
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          case 'goal_high':
            return b.goalAmount - a.goalAmount;
          case 'raised_high':
            return b.raisedAmount - a.raisedAmount;
          default:
            return 0;
        }
      });
  }, [campaigns, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent z-0" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-chart-3">
              Discover the Future
            </h1>
            <p className="text-xl text-muted-foreground">
              Explore high-potential Web3 and Tech startups curated for institutional-grade funding.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-16 z-30 bg-background/80 backdrop-blur-md border-b border-border py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search and Category Tabs */}
            <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/50 border-none ring-1 ring-border focus-visible:ring-primary"
                />
              </div>
              <Tabs
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                className="w-full overflow-x-auto"
              >
                <TabsList className="bg-secondary/50 p-1">
                  {CATEGORIES.map((cat) => (
                    <TabsTrigger
                      key={cat}
                      value={cat}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Sorting and View Toggle */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Sort by:</span>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px] bg-secondary/50 border-none ring-1 ring-border">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="hidden sm:flex">
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mock data banner — shown when contracts are not deployed / Ganache is not running */}
      <AnimatePresence>
        {isMockData && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-amber-500/10 border-y border-amber-500/30 py-3 px-4"
          >
            <div className="container mx-auto flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <span className="font-semibold">Demo mode</span> — Smart contracts not detected on Ganache.
                Deploy your contracts in Remix IDE and update{' '}
                <code className="font-mono text-xs bg-amber-500/20 px-1.5 py-0.5 rounded">
                  src/lib/contractAddresses.ts
                </code>{' '}
                to see live data.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-muted-foreground">
              {loading
                ? 'Loading from blockchain...'
                : error
                  ? <span className="text-destructive">{error}</span>
                  : <>{isMockData ? 'Showing' : 'Showing'} <span className="font-medium text-foreground">{filteredCampaigns.length}</span> {isMockData ? 'demo campaigns' : 'live campaigns'}</>
              }
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && <AnimatePresence mode="popLayout">
            {filteredCampaigns.length > 0 || error ? (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredCampaigns.map((campaign) => (
                  <motion.div key={campaign.id} variants={staggerItem}>
                    <CampaignCard campaign={campaign} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No campaigns found</h3>
                <p className="text-muted-foreground max-w-md">
                  We couldn't find any campaigns matching your current search or filters. Try adjusting your criteria.
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="mt-4 text-primary"
                >
                  Clear all filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-4">Have a groundbreaking idea?</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join a growing community of entrepreneurs raising ETH on the most transparent crowdfunding platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20" asChild>
                <Link to={ROUTE_PATHS.CREATE_CAMPAIGN}>Launch Your Campaign</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                <Link to={ROUTE_PATHS.ABOUT}>How it Works</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
