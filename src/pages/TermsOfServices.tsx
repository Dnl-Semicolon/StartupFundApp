import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '@/lib/index';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="space-y-3 text-muted-foreground text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function TermsOfServices() {
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
              <FileText className="w-4 h-4" />
              Legal
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: January 1, 2026 &nbsp;·&nbsp; Effective immediately upon use of the platform
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="container mx-auto max-w-3xl"
        >
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using the StartupFund platform ("Platform"), you agree to be bound by these
              Terms of Service ("Terms"). If you do not agree to these Terms, you must not use the Platform.
            </p>
            <p>
              These Terms constitute a legally binding agreement between you and StartupFund Protocol. Your
              use of the Platform, including connecting a wallet, creating campaigns, or funding campaigns,
              constitutes acceptance of these Terms.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>
              You must be at least 18 years of age to use this Platform. By using the Platform, you represent
              and warrant that you meet this age requirement and that you have the legal capacity to enter into
              a binding agreement.
            </p>
            <p>
              The Platform is not available to persons located in jurisdictions where the use of blockchain
              platforms or cryptocurrency is prohibited or restricted by law. It is your responsibility to
              ensure compliance with local laws.
            </p>
          </Section>

          <Section title="3. Platform Description">
            <p>
              StartupFund is a decentralized crowdfunding platform deployed on the Ethereum blockchain
              (development testnet for this version). The Platform facilitates:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Creation of fundraising campaigns by registered entrepreneurs</li>
              <li>Contributions of ETH to active campaigns by registered contributors</li>
              <li>Automatic fund release to campaign creators upon reaching the funding goal</li>
              <li>Automatic refunds to contributors when campaigns fail to reach their goal by the deadline</li>
              <li>Issuance of ERC-20 reward tokens to contributors of successfully funded campaigns</li>
            </ul>
            <p>
              All actions are governed by immutable smart contracts on-chain. StartupFund Protocol does not
              hold, control, or intermediate any funds.
            </p>
          </Section>

          <Section title="4. Registration and Wallet Use">
            <p>
              To create campaigns or contribute to campaigns, you must register your Ethereum wallet address
              with the Platform's AccessControl smart contract. Registration is free (gas fees apply) and
              links your wallet to your Platform identity.
            </p>
            <p>
              You are solely responsible for the security of your private keys and wallet. StartupFund Protocol
              has no ability to recover lost wallets, reverse transactions, or intervene in any on-chain activity.
            </p>
            <p>
              You agree not to use the Platform through wallets controlled by automated systems, bots, or any
              mechanism intended to manipulate campaign outcomes.
            </p>
          </Section>

          <Section title="5. Campaign Creation Rules">
            <p>Entrepreneurs creating campaigns agree to the following:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Campaigns must have a funding goal greater than 0 ETH</li>
              <li>Campaign deadlines must be between 1 and 60 days from creation</li>
              <li>Minimum contribution amounts must be at least 0.001 ETH</li>
              <li>Campaign titles, descriptions, and materials must be accurate and not misleading</li>
              <li>Campaigns may not be used for illegal purposes, money laundering, or fraud</li>
              <li>Once the first contribution is received, campaign parameters are locked on-chain</li>
            </ul>
            <p>
              StartupFund Protocol reserves the right (via community flagging mechanisms) to pause campaigns
              that violate these rules. Five community flags will automatically set a campaign to FLAGGED status,
              enabling contributor refunds.
            </p>
          </Section>

          <Section title="6. Contributions and Refunds">
            <p>
              Contributors acknowledge that ETH contributed to a campaign is locked in the FundingVault smart
              contract until one of the following occurs:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Campaign FUNDED:</strong> Creator may withdraw the full amount; contributors receive reward tokens</li>
              <li><strong>Campaign CANCELLED:</strong> Goal not met by deadline; contributors may claim a full refund</li>
              <li><strong>Campaign FLAGGED:</strong> Paused by community vote; contributors may claim a full refund</li>
            </ul>
            <p>
              Refunded contributors do not receive reward tokens. Gas fees for contribution, withdrawal, and
              refund transactions are the responsibility of the initiating party.
            </p>
          </Section>

          <Section title="7. Reward Tokens">
            <p>
              ERC-20 reward tokens are minted automatically upon campaign funding success, at a rate of 1 token
              per 1 wei contributed. These tokens are transferred to contributor wallets as part of the
              settlement process.
            </p>
            <p>
              Reward tokens represent a record of contribution and do not constitute equity, debt, profit
              sharing, or any other financial instrument unless explicitly stated in the campaign's terms.
              Token value is not guaranteed.
            </p>
          </Section>

          <Section title="8. Prohibited Activities">
            <p>You agree not to use the Platform to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Commit fraud, misrepresentation, or deception</li>
              <li>Launder money or finance illegal activities</li>
              <li>Manipulate campaign flag counts through coordinated abuse</li>
              <li>Attempt to exploit or hack smart contracts</li>
              <li>Impersonate other users or entities</li>
              <li>Violate any applicable local, national, or international laws</li>
            </ul>
          </Section>

          <Section title="9. Disclaimers and Limitation of Liability">
            <p>
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. STARTUPFUND PROTOCOL MAKES
              NO WARRANTY THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
            <p>
              STARTUPFUND PROTOCOL IS NOT LIABLE FOR ANY LOSS OF FUNDS, FAILED TRANSACTIONS, SMART CONTRACT
              BUGS, OR BLOCKCHAIN NETWORK ISSUES. CRYPTO INVESTMENTS CARRY SIGNIFICANT RISK — YOU MAY LOSE
              ALL CONTRIBUTED FUNDS.
            </p>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, STARTUPFUND PROTOCOL'S TOTAL LIABILITY SHALL NOT EXCEED
              THE AMOUNT OF GAS FEES PAID BY YOU IN THE LAST 30 DAYS.
            </p>
          </Section>

          <Section title="10. Amendments">
            <p>
              StartupFund Protocol reserves the right to modify these Terms at any time. Material changes will
              be communicated via the Platform. Continued use after changes constitutes acceptance of the
              updated Terms.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These Terms are governed by and construed in accordance with generally accepted principles of
              international commercial law, given the decentralized and borderless nature of the Platform.
              Disputes shall be resolved through binding arbitration.
            </p>
          </Section>

          <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Related:</span>
            <Link to={ROUTE_PATHS.PRIVACY_POLICY}  className="text-primary hover:underline">Privacy Policy</Link>
            <Link to={ROUTE_PATHS.COOKIE_POLICY}   className="text-primary hover:underline">Cookie Policy</Link>
            <Link to={ROUTE_PATHS.FAQ}              className="text-primary hover:underline">FAQ</Link>
            <Link to={ROUTE_PATHS.NETWORK_STATUS}   className="text-primary hover:underline">Network Status</Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
