import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
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

export default function PrivacyPolicy() {
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
              <ShieldCheck className="w-4 h-4" />
              Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: April 2026</p>
          </motion.div>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <p className="text-muted-foreground text-sm leading-relaxed mb-10">
              This Privacy Policy describes how StartupFund ("we", "us", or "our") handles information when you use the StartupFund platform. Because StartupFund is a decentralized application (dApp), the amount of personal data we collect is minimal by design.
            </p>

            <Section title="1. What Information We Collect">
              <p><strong className="text-foreground">Blockchain Data (Public)</strong></p>
              <p>
                All on-chain interactions — including wallet addresses, campaign creation, contributions, withdrawals, refunds, and reward token mints — are recorded on the Ethereum blockchain. This data is public by the nature of the blockchain and not under our control. Any party with access to the blockchain can view this information.
              </p>
              <p><strong className="text-foreground">Local Storage</strong></p>
              <p>
                We store a lightweight registration cache in your browser's localStorage (key: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">sf_registered_&lt;address&gt;</code>) to reduce on-chain read calls. This data never leaves your device.
              </p>
              <p><strong className="text-foreground">Analytics (if enabled)</strong></p>
              <p>
                We may collect anonymised usage analytics (page views, session duration, error rates) using privacy-respecting tooling. No personally identifiable information is collected through analytics.
              </p>
            </Section>

            <Section title="2. What We Do Not Collect">
              <ul className="list-disc pl-5 space-y-1">
                <li>Real names, email addresses, phone numbers, or any government-issued identifiers.</li>
                <li>Private keys or seed phrases — we never ask for these and you should never share them.</li>
                <li>Precise geolocation data.</li>
                <li>Financial information beyond what is publicly visible on-chain.</li>
              </ul>
            </Section>

            <Section title="3. How We Use Information">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Serve the Platform UI and provide campaign data.</li>
                <li>Cache your registration status to improve UX (localStorage only).</li>
                <li>Monitor platform health and detect errors.</li>
                <li>Improve the Platform's features and performance over time.</li>
              </ul>
              <p>
                We do not sell, rent, or share any information about you with third parties for marketing purposes.
              </p>
            </Section>

            <Section title="4. Blockchain Transparency">
              <p>
                By using a public blockchain you accept that certain actions are permanently and publicly recorded. This includes your wallet address, contribution amounts, campaign details you submit, and token balances. These records cannot be deleted or modified by us or by you once confirmed on-chain.
              </p>
              <p>
                If you have privacy concerns about on-chain activity, consider using a dedicated wallet address for Platform interactions.
              </p>
            </Section>

            <Section title="5. Cookies">
              <p>
                StartupFund uses minimal cookies. For full details, please review our{' '}
                <Link to={ROUTE_PATHS.COOKIES} className="text-primary hover:underline">Cookie Policy</Link>.
              </p>
            </Section>

            <Section title="6. Third-Party Services">
              <p>
                The Platform may load images from third-party CDN providers (e.g., Pixabay). These services have their own privacy policies. We are not responsible for the data practices of external services.
              </p>
              <p>
                Wallet interactions are handled by MetaMask, which has its own Privacy Policy. Please review MetaMask's policies before connecting your wallet.
              </p>
            </Section>

            <Section title="7. Data Retention">
              <p>
                On-chain data is retained permanently as part of the Ethereum blockchain and is outside our control. localStorage data is retained in your browser until you clear it or uninstall your browser.
              </p>
            </Section>

            <Section title="8. Children's Privacy">
              <p>
                StartupFund is not intended for children under the age of 18. We do not knowingly collect information from children. If you believe a child has used the Platform, please contact us and we will take appropriate action within the scope of our ability.
              </p>
            </Section>

            <Section title="9. Your Rights">
              <p>
                Depending on your jurisdiction, you may have rights regarding your personal data, including the right to access, correct, or delete data we hold about you. However, because most data exists on a public blockchain rather than in systems we control, our ability to act on such requests may be limited.
              </p>
              <p>
                For data stored in our off-chain systems (analytics, logs), contact us to exercise your rights.
              </p>
            </Section>

            <Section title="10. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. Changes will be reflected by the updated date at the top of this page. Continued use of the Platform after changes are posted constitutes acceptance of the revised Policy.
              </p>
            </Section>

            <Section title="11. Contact">
              <p>
                Questions about this Privacy Policy can be directed to the StartupFund team through the channels listed on the{' '}
                <Link to={ROUTE_PATHS.ABOUT} className="text-primary hover:underline">About page</Link>.
              </p>
            </Section>
          </motion.div>
        </div>
      </section>

      {/* Footer links */}
      <section className="py-12 px-4 border-t border-border bg-muted/20">
        <div className="container mx-auto max-w-3xl text-center text-sm text-muted-foreground">
          <div className="flex flex-wrap justify-center gap-6">
            <Link to={ROUTE_PATHS.FAQ} className="hover:text-primary transition-colors">FAQ</Link>
            <Link to={ROUTE_PATHS.TERMS} className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to={ROUTE_PATHS.COOKIES} className="hover:text-primary transition-colors">Cookie Policy</Link>
            <Link to={ROUTE_PATHS.NETWORK_STATUS} className="hover:text-primary transition-colors">Network Status</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
