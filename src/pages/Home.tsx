import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Rocket,
  ShieldCheck,
  TrendingUp,
  Globe,
  ArrowRight,
  Layers,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { CampaignCard, FeatureCard, StatsCard } from '@/components/Cards';
import { useCampaigns } from '@/hooks/useCampaigns';
import { IMAGES } from '@/assets/images';
import { Button } from '@/components/ui/button';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const { campaigns, isMockData } = useCampaigns();
  const featuredCampaigns = campaigns.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-background">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-chart-2/10 rounded-full blur-[100px]" />
          <img 
            src={IMAGES.BLOCKCHAIN_BG_1} 
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay"
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>Next-Gen Decentralized Fundraising</span>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="text-5xl lg:text-7xl font-bold leading-tight"
              >
                Where <span className="text-primary">Sharks</span> Meet the <span className="text-chart-2">Future</span>
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-xl text-muted-foreground max-w-lg leading-relaxed"
              >
                StartupFund is the premier decentralised platform for entrepreneurs to pitch visionary ideas and for contributors to back the next generation of startups via smart contracts.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button size="lg" className="h-14 px-8 text-lg font-semibold" asChild>
                  <Link to={ROUTE_PATHS.CAMPAIGNS}>
                    Explore Campaigns <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold" asChild>
                  <Link to={ROUTE_PATHS.CREATE_CAMPAIGN}>Launch a Campaign</Link>
                </Button>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex items-center gap-8 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="User" />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    +2k
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Trusted by <span className="text-foreground font-bold">2,500+</span> contributors worldwide
                </p>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block relative"
            >
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img 
                  src={IMAGES.HERO_STARTUP_1} 
                  alt="Pitch Presentation" 
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-6 backdrop-blur-md bg-white/10 rounded-xl border border-white/20">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/60 text-sm mb-1">Current Featured Project</p>
                      <h3 className="text-white text-xl font-bold">EcoFlow Smart Grid</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-chart-2 font-bold text-lg">69% Funded</p>
                      <div className="w-32 h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
                        <div className="bg-chart-2 h-full w-[69%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating Decorative Elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-chart-2/20 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatsCard title="Active Campaigns" value={campaigns.filter(c => c.status === 'active').length.toString() || '--'} />
            <StatsCard title="Total Funded" value={`${campaigns.reduce((s, c) => s + c.raisedAmount, 0).toFixed(1)} ETH`} />
            <StatsCard title="Total Contributors" value={campaigns.reduce((sum, c) => sum + c.backersCount, 0).toString()} />
            <StatsCard title="Success Rate" value={campaigns.length > 0 ? `${Math.round((campaigns.filter(c => c.status === 'funded').length / campaigns.length) * 100)}%` : '--'} />
          </div>
        </div>
      </section>

      {/* Featured Campaigns Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Featured Opportunities
                {isMockData && (
                  <span className="ml-3 inline-flex items-center gap-1 text-sm font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Demo Data
                  </span>
                )}
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl">
                {isMockData
                  ? 'Contracts not yet deployed — showing sample campaigns. Deploy to see live data.'
                  : 'Hand-picked startups that are redefining industries with blockchain technology.'}
              </p>
            </div>
            <Button variant="ghost" className="group" asChild>
              <Link to={ROUTE_PATHS.CAMPAIGNS}>
                View All Campaigns <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">The New Era of Crowdfunding</h2>
            <p className="text-muted-foreground text-lg">
              We've replaced the traditional bureaucracy with transparency, speed, and security through decentralized governance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-primary" />}
              title="Trustless Security"
              description="All funds are held in audited smart contracts. Funds are only released when milestones are verified by the community."
            />
            <FeatureCard
              icon={<Rocket className="w-8 h-8 text-primary" />}
              title="Reward Tokens"
              description="Contributors receive ERC-20 reward tokens proportional to their ETH contribution when a campaign is successfully funded."
            />
            <FeatureCard
              icon={<Globe className="w-8 h-8 text-primary" />}
              title="Global Access"
              description="Connect with visionary founders from every corner of the world. No banks, no gatekeepers — just a wallet and an idea."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8 text-primary" />}
              title="Real-time Tracking"
              description="Monitor campaign progress, contribution history, and funding milestones in real time directly from the blockchain."
            />
            <FeatureCard
              icon={<Layers className="w-8 h-8 text-primary" />}
              title="On-Chain Transparency"
              description="Every contribution, withdrawal, and refund is permanently recorded on the blockchain and publicly verifiable."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-primary" />}
              title="Low Entry Barrier"
              description="Anyone can participate in high-potential startups with a minimum contribution of 0.001 ETH — no accreditation needed."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden bg-primary p-12 lg:p-20 text-center">
            <div className="absolute inset-0 z-0">
              <img 
                src={IMAGES.TEAM_WORK_1} 
                alt="Collaboration"
                className="w-full h-full object-cover opacity-20 mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-chart-3/50" />
            </div>
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-primary-foreground tracking-tight">
                Ready to Fund the Future?
              </h2>
              <p className="text-xl text-primary-foreground/80 leading-relaxed">
                Join thousands of contributors already backing the next generation of startups. Participate in the decentralised economy today.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold shadow-xl hover:shadow-2xl transition-all" asChild>
                  <Link to={ROUTE_PATHS.CAMPAIGNS}>Explore Campaigns</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-white/30 text-white hover:bg-white/10" asChild>
                  <Link to={ROUTE_PATHS.ABOUT}>Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
