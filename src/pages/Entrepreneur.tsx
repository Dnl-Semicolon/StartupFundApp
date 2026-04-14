import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Rocket,
  Coins,
  ShieldCheck,
  Users,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Wallet,
  Target,
  Zap,
  RefreshCcw,
  BadgeCheck,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { springPresets, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';

// ── Data ─────────────────────────────────────────────────────────────────────

const steps = [
  {
    number: '01',
    icon: <Wallet className="w-6 h-6" />,
    title: 'Connect & Register',
    description:
      'Install MetaMask, connect your wallet, and register your account with one transaction on Ganache. Your wallet address becomes your identity on the platform.',
    cta: { label: 'Register now', path: ROUTE_PATHS.REGISTER },
  },
  {
    number: '02',
    icon: <PlusCircle className="w-6 h-6" />,
    title: 'Create Your Campaign',
    description:
      'Fill in your startup name, pitch, funding goal (ETH), minimum contribution, deadline (1–60 days), and a custom reward token symbol. Everything is stored on-chain.',
    cta: { label: 'Launch a campaign', path: ROUTE_PATHS.CREATE_CAMPAIGN },
  },
  {
    number: '03',
    icon: <Users className="w-6 h-6" />,
    title: 'Attract Investors',
    description:
      'Your live campaign appears on the Discover page. Investors browse, fund with ETH, and receive reward tokens proportional to their contribution.',
    cta: { label: 'Browse campaigns', path: ROUTE_PATHS.CAMPAIGNS },
  },
  {
    number: '04',
    icon: <Coins className="w-6 h-6" />,
    title: 'Withdraw on Success',
    description:
      'Once your goal is met, call Withdraw from your dashboard. The smart contract instantly releases all raised ETH to your wallet and mints reward tokens to investors.',
    cta: { label: 'View dashboard', path: ROUTE_PATHS.DASHBOARD },
  },
];

const benefits = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-primary" />,
    title: 'Trustless Fundraising',
    description:
      'Funds are locked in the smart contract and can only be released to you when the goal is met — no middlemen, no platform fees.',
  },
  {
    icon: <Zap className="w-6 h-6 text-primary" />,
    title: 'Instant Settlement',
    description:
      'Withdrawal is a single transaction. ETH lands in your wallet within seconds of calling the contract.',
  },
  {
    icon: <Coins className="w-6 h-6 text-primary" />,
    title: 'Custom Reward Tokens',
    description:
      'Assign your own token symbol (e.g. EFLOW). Investors automatically receive ERC-20 tokens 1:1 with their ETH on campaign success.',
  },
  {
    icon: <RefreshCcw className="w-6 h-6 text-primary" />,
    title: 'Automatic Refunds',
    description:
      'If your campaign does not hit its goal by the deadline, every contributor gets a full refund — enforced by code, not promises.',
  },
  {
    icon: <Target className="w-6 h-6 text-primary" />,
    title: 'Flexible Goals',
    description:
      'Set your funding goal in ETH, define a per-campaign minimum contribution, and choose any deadline between 1 and 60 days.',
  },
  {
    icon: <BadgeCheck className="w-6 h-6 text-primary" />,
    title: 'On-Chain Credibility',
    description:
      'Every campaign, contribution, and withdrawal is permanently recorded on the blockchain — building verifiable trust with your investor community.',
  },
];

const requirements = [
  'A MetaMask wallet installed in your browser',
  'Ganache running locally (RPC: http://127.0.0.1:7545, Chain ID: 1337)',
  'MetaMask connected to the Ganache network',
  'Small amount of ETH for gas fees (< 0.01 ETH)',
  'A startup idea with a clear funding goal and timeline',
];

const faqs = [
  {
    q: 'How much does it cost to create a campaign?',
    a: 'Only the Ethereum gas fee for the createCampaign transaction (a few cents on Ganache). The platform itself charges zero fees.',
  },
  {
    q: 'What happens if I do not reach my goal?',
    a: 'The campaign is automatically marked as CANCELLED once the deadline passes. All contributors can claim a full refund directly from the smart contract — you receive nothing.',
  },
  {
    q: 'Can I edit my campaign after launch?',
    a: 'Descriptions can be updated off-chain, but core parameters — goal amount and deadline — are locked on the smart contract once the first contribution is received.',
  },
  {
    q: 'What is the reward token and who gets it?',
    a: 'Each campaign has a custom ERC-20 symbol you choose (e.g. NEXUS). When you withdraw funds, the smart contract mints one token per wei contributed to every backer. Contributors who claimed refunds do not receive tokens.',
  },
  {
    q: 'How long can my campaign run?',
    a: 'Between 1 and 60 days. The deadline is set at creation and enforced by the contract — it cannot be extended.',
  },
  {
    q: 'Do I need to deploy my own contracts?',
    a: 'No. The platform contracts (StartupFund, CampaignManager, RewardToken, AccessControl) are already deployed. You only interact with them through the UI or Remix IDE.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Entrepreneur() {
  const { isConnected, connect, isConnecting } = useWallet();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<string>('');

  const handleGetStarted = () => {
    if (isConnected) {
      navigate(ROUTE_PATHS.CREATE_CAMPAIGN);
    } else {
      navigate(ROUTE_PATHS.REGISTER);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={staggerItem}>
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm gap-2">
                <Rocket className="w-3.5 h-3.5" />
                For Entrepreneurs & Founders
              </Badge>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight"
            >
              Raise Funds.{' '}
              <span className="text-primary">On-Chain.</span>
              <br />
              No Middlemen.
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              StartupFund lets you pitch your startup, set a funding goal, and collect ETH from
              global investors — all enforced by smart contracts. No banks, no gatekeepers.
            </motion.p>

            <motion.div variants={staggerItem} className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="h-14 px-10 text-lg gap-2 shadow-xl shadow-primary/20"
              >
                <Rocket className="w-5 h-5" />
                {isConnected ? 'Launch Your Campaign' : 'Get Started Free'}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-10 text-lg">
                <Link to={ROUTE_PATHS.CAMPAIGNS}>See Live Campaigns</Link>
              </Button>
            </motion.div>

            {!isConnected && (
              <motion.p variants={staggerItem} className="text-xs text-muted-foreground mt-6">
                You'll need MetaMask installed.{' '}
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="underline underline-offset-2 hover:text-primary transition-colors"
                >
                  {isConnecting ? 'Connecting...' : 'Connect wallet now →'}
                </button>
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">Process</Badge>
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From wallet connection to receiving funds — four steps, all on-chain.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springPresets.gentle, delay: idx * 0.1 }}
              >
                <Card className="h-full relative overflow-hidden group hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                  <div className="absolute top-4 right-4 text-6xl font-black text-muted/20 select-none group-hover:text-primary/10 transition-colors">
                    {step.number}
                  </div>
                  <CardHeader className="pb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      {step.icon}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm leading-relaxed">
                      {step.description}
                    </CardDescription>
                    <Link
                      to={step.cta.path}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:gap-2 transition-all"
                    >
                      {step.cta.label}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">Why StartupFund</Badge>
            <h2 className="text-4xl font-bold mb-4">Built for Founders</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every feature was designed to remove friction between a great idea and the capital it needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, idx) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springPresets.gentle, delay: idx * 0.08 }}
              >
                <Card className="h-full hover:shadow-md hover:border-primary/20 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      {b.icon}
                    </div>
                    <CardTitle className="text-base">{b.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">{b.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Requirements ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={springPresets.gentle}
            >
              <Badge variant="outline" className="mb-4">Requirements</Badge>
              <h2 className="text-4xl font-bold mb-4">What You Need to Start</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                No bank account, no legal entity — just a wallet and an idea. Here's the checklist
                before you launch.
              </p>
              <ul className="space-y-4">
                {requirements.map((req, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...springPresets.gentle, delay: idx * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm leading-relaxed">{req}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ ...springPresets.gentle, delay: 0.1 }}
            >
              <Card className="border-primary/20 bg-primary/5 overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Rocket className="w-5 h-5 text-primary" />
                    Campaign Rules
                  </CardTitle>
                  <CardDescription>Enforced by the smart contract — not by us</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Campaign duration', value: '1 – 60 days' },
                    { label: 'Minimum goal', value: '> 0 ETH' },
                    { label: 'Global min. contribution', value: '0.001 ETH' },
                    { label: 'Platform fee', value: '0%' },
                    { label: 'Reward token ratio', value: '1 token per 1 ETH' },
                    { label: 'Withdrawal', value: 'Once, after goal met' },
                    { label: 'Refund (failed campaigns)', value: 'Automatic, full amount' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold font-mono">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4">
              <HelpCircle className="w-3 h-3 mr-1" />
              FAQ
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Common Questions</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Accordion type="single" collapsible value={openFaq} onValueChange={setOpenFaq}>
              {faqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`}>
                  <AccordionTrigger className="text-left text-sm font-medium hover:text-primary">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      <Separator />

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-2xl mx-auto"
          >
            <motion.div variants={staggerItem}>
              <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-8">
                <Rocket className="w-10 h-10" />
              </div>
            </motion.div>
            <motion.h2 variants={staggerItem} className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Ready to raise your first round?
            </motion.h2>
            <motion.p variants={staggerItem} className="text-muted-foreground text-lg mb-10">
              Register your wallet, fill in your campaign details, and you're live on the blockchain in under two minutes.
            </motion.p>
            <motion.div variants={staggerItem} className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="h-14 px-12 text-lg gap-2 shadow-xl shadow-primary/25"
              >
                {isConnected ? 'Create Campaign' : 'Register & Launch'}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="ghost" asChild className="h-14 px-8 text-lg">
                <Link to={ROUTE_PATHS.ABOUT}>Learn more about StartupFund</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
