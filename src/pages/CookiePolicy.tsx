import React from 'react';
import { motion } from 'framer-motion';
import { Cookie } from 'lucide-react';
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

const cookieTable = [
  {
    name: 'sf_registered_<address>',
    type: 'localStorage',
    purpose: 'Caches whether your wallet is registered on-chain to reduce RPC calls.',
    duration: 'Until browser storage is cleared',
    essential: true,
  },
  {
    name: 'Theme preference',
    type: 'localStorage',
    purpose: 'Remembers your light/dark mode choice.',
    duration: 'Persistent',
    essential: true,
  },
  {
    name: 'Analytics session',
    type: 'Session cookie',
    purpose: 'Anonymised usage analytics to help us improve the platform. No personal identifiers.',
    duration: 'Session (cleared on browser close)',
    essential: false,
  },
];

export default function CookiePolicy() {
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
              <Cookie className="w-4 h-4" />
              Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Cookie Policy</h1>
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
              This Cookie Policy explains how StartupFund ("we", "us", or "our") uses cookies and similar browser storage technologies when you visit the Platform. StartupFund is a decentralized application and uses very few cookies by design.
            </p>

            <Section title="1. What Are Cookies?">
              <p>
                Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work efficiently and to provide information to the site owner. We also use browser <strong className="text-foreground">localStorage</strong> — a similar mechanism that stores data in your browser without an expiry date unless explicitly cleared.
              </p>
            </Section>

            <Section title="2. Cookies We Use">
              <p>The table below lists every cookie and localStorage entry used by StartupFund:</p>

              <div className="mt-4 rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Type</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Purpose</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Duration</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Essential</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cookieTable.map((row, i) => (
                      <tr key={i} className={i < cookieTable.length - 1 ? 'border-b border-border' : ''}>
                        <td className="px-4 py-3 font-mono text-foreground/80 break-all">{row.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.type}</td>
                        <td className="px-4 py-3">{row.purpose}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.duration}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${row.essential ? 'bg-chart-2/20 text-chart-2' : 'bg-muted text-muted-foreground'}`}>
                            {row.essential ? 'Yes' : 'Optional'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="3. Essential vs. Optional Cookies">
              <p>
                <strong className="text-foreground">Essential cookies</strong> are required for the Platform to function correctly. They are used for registration caching and UI preference storage. You cannot opt out of essential cookies while using the Platform.
              </p>
              <p>
                <strong className="text-foreground">Optional cookies</strong> (e.g., analytics) are used to improve the Platform and may be disabled without affecting core functionality. Because StartupFund does not display a cookie consent banner, optional analytics are fully anonymised and comply with privacy-first principles.
              </p>
            </Section>

            <Section title="4. Third-Party Cookies">
              <p>
                StartupFund does not embed third-party advertising, social media tracking pixels, or analytics SDKs that set their own cookies. Images loaded from external CDN providers (e.g., Pixabay) may set their own session cookies governed by their respective privacy policies.
              </p>
            </Section>

            <Section title="5. How to Manage or Delete Cookies">
              <p>
                You can control, disable, or delete cookies through your browser settings. Here are links to instructions for common browsers:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Chrome — Settings › Privacy and security › Cookies and other site data</li>
                <li>Firefox — Settings › Privacy &amp; Security › Cookies and Site Data</li>
                <li>Safari — Preferences › Privacy › Manage Website Data</li>
                <li>Edge — Settings › Cookies and site permissions</li>
              </ul>
              <p>
                To clear StartupFund's localStorage specifically, open your browser's developer tools (F12), navigate to Application › Local Storage, find your site's origin, and delete the entries prefixed with <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">sf_</code>.
              </p>
              <p>
                Disabling essential cookies may prevent the Platform from working as intended (e.g., requiring repeated on-chain registration checks).
              </p>
            </Section>

            <Section title="6. Changes to This Policy">
              <p>
                We may update this Cookie Policy from time to time. Changes will be reflected by the updated date at the top of this page.
              </p>
            </Section>

            <Section title="7. Contact">
              <p>
                Questions about this Cookie Policy may be directed to the StartupFund team through the channels listed on the{' '}
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
            <Link to={ROUTE_PATHS.PRIVACY} className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to={ROUTE_PATHS.NETWORK_STATUS} className="hover:text-primary transition-colors">Network Status</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
