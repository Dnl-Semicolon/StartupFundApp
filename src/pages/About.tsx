import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Cpu, Globe, Users, CheckCircle2, ArrowRight, Zap, Lock, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IMAGES } from '@/assets/images';
import { ROUTE_PATHS } from '@/lib/index';

const springPresets = {
  gentle: { stiffness: 300, damping: 35 },
  smooth: { stiffness: 200, damping: 40 }
};

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: springPresets.gentle
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src={IMAGES.BLOCKCHAIN_BG_2} 
            alt="Blockchain Network" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-3xl"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.span 
              variants={fadeInUp}
              className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20"
            >
              Our Mission
            </motion.span>
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70"
            >
              Democratizing the Next <br />
              Generation of Startups.
            </motion.h1>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-muted-foreground leading-relaxed mb-10"
            >
              StartupFund bridges the gap between visionary entrepreneurs and global capital. 
              Inspired by the professional rigor of high-stakes venture capital and powered by 
              the transparency of blockchain technology, we're building the first decentralized Shark Tank.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Core Philosophy Section */}
      <section className="py-24 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={springPresets.smooth}
            >
              <h2 className="text-3xl font-bold mb-6">Beyond Traditional Crowdfunding</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Unlike traditional platforms where trust is centralized and fees are opaque, 
                StartupFund operates on an institutional-grade decentralized framework. 
                We believe that great ideas shouldn't be gated by geography or connections.
              </p>
              <div className="space-y-4">
                {[ 
                  "Automated Milestone-Based Funding", 
                  "Transparent On-Chain Transactions",
                  "Direct Peer-to-Peer Governance",
                  "Tokenized Equity Rewards"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div 
              className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={springPresets.smooth}
            >
              <img 
                src={IMAGES.INNOVATION_5} 
                alt="Innovation Hub" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">The Web3 Edge</h2>
            <p className="text-muted-foreground">Our platform is built on cutting-edge blockchain protocols to ensure security and trust.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ y: -8 }}
            >
              <div className="h-12 w-12 rounded-xl bg-chart-1/10 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-chart-1" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Contracts</h3>
              <p className="text-muted-foreground">
                Funding is locked in audited smart contracts. Funds are only released when entrepreneurs reach verified milestones.
              </p>
            </motion.div>

            <motion.div 
              className="p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ y: -8 }}
            >
              <div className="h-12 w-12 rounded-xl bg-chart-2/10 flex items-center justify-center mb-6">
                <Eye className="h-6 w-6 text-chart-2" />
              </div>
              <h3 className="text-xl font-bold mb-3">Full Transparency</h3>
              <p className="text-muted-foreground">
                Every contribution and withdrawal is recorded on-chain, providing a permanent, immutable audit trail for all stakeholders.
              </p>
            </motion.div>

            <motion.div 
              className="p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ y: -8 }}
            >
              <div className="h-12 w-12 rounded-xl bg-chart-3/10 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-chart-3" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Liquidity</h3>
              <p className="text-muted-foreground">
                Reward tokens provide immediate utility or can be traded within the ecosystem, unlike traditional locked equity.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team/Collaborative Section */}
      <section className="py-24 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={springPresets.smooth}
            >
              <img 
                src={IMAGES.TEAM_WORK_4} 
                alt="Our Team" 
                className="rounded-2xl shadow-2xl opacity-90"
              />
            </motion.div>
            <div>
              <h2 className="text-4xl font-bold mb-6">Built by Visionaries for Visionaries</h2>
              <p className="text-background/70 mb-8 text-lg leading-relaxed">
                The StartupFund team consists of venture capital veterans, blockchain architects, and community builders. 
                We are united by the belief that decentralized finance is the ultimate tool for global economic inclusion.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">500+</div>
                  <div className="text-background/50 text-sm">Projects Launched</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">$120M+</div>
                  <div className="text-background/50 text-sm">Total Value Raised</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">45k</div>
                  <div className="text-background/50 text-sm">Active Backers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">12</div>
                  <div className="text-background/50 text-sm">Global Offices</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto bg-primary/5 p-12 rounded-3xl border border-primary/20"
          >
            <h2 className="text-4xl font-bold mb-6">Ready to make history?</h2>
            <p className="text-muted-foreground mb-10">
              Whether you're an entrepreneur with a world-changing idea or an investor looking for the next big thing, 
              your journey starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to={ROUTE_PATHS.CREATE_CAMPAIGN} 
                className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Launch Your Startup <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                to={ROUTE_PATHS.CAMPAIGNS} 
                className="px-8 py-4 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-accent transition-colors border border-border flex items-center justify-center gap-2"
              >
                Browse Campaigns
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2026 StartupFund Protocol. Built for a decentralized future.</p>
        </div>
      </footer>
    </div>
  );
}
