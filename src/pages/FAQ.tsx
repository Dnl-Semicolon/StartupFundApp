import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '@/lib/index';

interface FAQItem {
  question: string;
  answer: string;
}

const sections: { title: string; items: FAQItem[] }[] = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'What is StartupFund?',
        answer:
          'StartupFund is a decentralized crowdfunding platform built on Ethereum. Entrepreneurs can create campaigns to raise ETH from backers worldwide, with all funds, rules, and reward token distributions enforced automatically by smart contracts — no intermediaries.',
      },
      {
        question: 'Do I need an account to use StartupFund?',
        answer:
          'No traditional account is needed. You connect with your Ethereum wallet (MetaMask). When you connect for the first time, the platform automatically registers your wallet address on-chain — one transaction, no username or password.',
      },
      {
        question: 'Which wallet should I use?',
        answer:
          'StartupFund currently supports MetaMask. Make sure you have MetaMask installed and your wallet is set to the Ganache local network (Chain ID: 1337, RPC: http://127.0.0.1:7545).',
      },
      {
        question: 'Is StartupFund free to use?',
        answer:
          'The platform itself charges no fees. You only pay standard Ethereum gas fees for on-chain transactions (creating campaigns, contributing, withdrawing, claiming refunds). On a development testnet these are negligible.',
      },
    ],
  },
  {
    title: 'Campaigns',
    items: [
      {
        question: 'Who can create a campaign?',
        answer:
          'Any registered wallet can create a campaign. Simply connect your wallet, click "Launch a Campaign", and fill in the details — title, goal amount, deadline (1–60 days), minimum contribution, and reward token symbol.',
      },
      {
        question: 'What is the minimum / maximum campaign duration?',
        answer:
          'Campaigns must run for at least 1 day and at most 60 days from creation. The deadline is set as a Unix timestamp and enforced by the smart contract.',
      },
      {
        question: 'Can I edit my campaign after it is live?',
        answer:
          'You can edit the title, description, short description, and image URL before anyone has contributed. Once the first contribution is recorded on-chain, the campaign is locked and no edits are permitted.',
      },
      {
        question: 'What happens when a campaign reaches its goal?',
        answer:
          'The campaign status changes to FUNDED automatically. Reward tokens (1 token per 1 ETH contributed) are minted for all backers, and the creator can then call Withdraw to receive the full raised amount in one transaction.',
      },
      {
        question: 'What happens if a campaign does not reach its goal?',
        answer:
          'After the deadline passes with the goal unmet, the campaign status moves to CANCELLED. Every contributor can claim a full refund via the "Claim Refund" button — no partial returns, no platform fee.',
      },
    ],
  },
  {
    title: 'Contributing & Refunds',
    items: [
      {
        question: 'What is the minimum contribution?',
        answer:
          'Each campaign sets its own minimum contribution (at least 0.001 ETH). The contract rejects any contribution below this floor.',
      },
      {
        question: 'Can I contribute multiple times to the same campaign?',
        answer:
          'Yes. Each new contribution is added to your running total for that campaign. Your reward token allocation and refund entitlement are both based on your cumulative contribution.',
      },
      {
        question: 'Can the campaign creator contribute to their own campaign?',
        answer:
          'No. The smart contract explicitly prevents creators from funding their own campaign to avoid manipulation.',
      },
      {
        question: 'How do I claim a refund?',
        answer:
          'Navigate to the campaign page or your Dashboard. If the campaign is CANCELLED or FLAGGED, a "Claim Refund" button appears. Click it, confirm the MetaMask transaction, and the full contributed amount is returned to your wallet in one step.',
      },
    ],
  },
  {
    title: 'Reward Tokens',
    items: [
      {
        question: 'What are reward tokens?',
        answer:
          'Each campaign defines an ERC-20 reward token (e.g. "HLT" for HealthCare). When a campaign is FUNDED, the RewardToken contract mints tokens at a 1:1 ratio with ETH contributed — 1 ETH = 1 token (18 decimals).',
      },
      {
        question: 'When are tokens minted?',
        answer:
          'Tokens are minted automatically the moment the campaign reaches its goal. They appear in your connected wallet immediately and can be viewed in MetaMask under the token contract address.',
      },
      {
        question: 'Do contributors who claimed a refund receive tokens?',
        answer:
          'No. The contract tracks refund status per contributor. If you claimed a refund, you are not eligible for reward tokens and the contract will reject any duplicate mint attempt.',
      },
      {
        question: 'Can I trade or transfer reward tokens?',
        answer:
          'Reward tokens are standard ERC-20 tokens so they are transferable. However, StartupFund does not operate a marketplace for them — that is outside the scope of this protocol.',
      },
    ],
  },
  {
    title: 'Security & Smart Contracts',
    items: [
      {
        question: 'Are the smart contracts audited?',
        answer:
          'The contracts are designed with security best practices: reentrancy guards on all ETH transfer functions, single-withdrawal pattern, and access-controlled state changes. Full audit documentation is available in the project whitepaper.',
      },
      {
        question: 'What happens if a campaign is flagged?',
        answer:
          'Community members can flag suspicious campaigns. Once 5 flags are accumulated, the campaign status changes to FLAGGED and contributors can immediately claim refunds — even before the deadline.',
      },
      {
        question: 'Can the platform admin freeze my wallet?',
        answer:
          'The AccessControl contract allows the platform owner to block wallets in cases of confirmed fraud. Blocked wallets cannot create campaigns, contribute, or perform any write action on the platform.',
      },
    ],
  },
];

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-accent/50 transition-colors"
      >
        <span className="font-medium text-sm leading-snug pr-4">{item.question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border bg-muted/20">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (key: string) => setOpenIndex(prev => (prev === key ? null : key));

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-20 px-4 border-b border-border">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4" />
              Help Center
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about StartupFund, campaigns, contributions, and reward tokens.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl space-y-14">
          {sections.map((section, si) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: si * 0.05 }}
            >
              <h2 className="text-xl font-bold mb-5">{section.title}</h2>
              <div className="space-y-3">
                {section.items.map((item, ii) => {
                  const key = `${si}-${ii}`;
                  return (
                    <AccordionItem
                      key={key}
                      item={item}
                      isOpen={openIndex === key}
                      onToggle={() => toggle(key)}
                    />
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer links */}
      <section className="py-12 px-4 border-t border-border bg-muted/20">
        <div className="container mx-auto max-w-3xl text-center text-sm text-muted-foreground">
          <p className="mb-3">Still have questions?</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to={ROUTE_PATHS.ABOUT} className="hover:text-primary transition-colors">About Us</Link>
            <Link to={ROUTE_PATHS.TERMS} className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to={ROUTE_PATHS.PRIVACY} className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to={ROUTE_PATHS.NETWORK_STATUS} className="hover:text-primary transition-colors">Network Status</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
