import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseEther } from 'ethers';
import { getStartupFund, ensureRegistered } from '@/lib/contracts';
import { useWallet } from '@/hooks/useWallet';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  ShieldCheck, 
  Zap, 
  Lightbulb, 
  ArrowLeft, 
  CheckCircle2,
  Globe,
  Info
} from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { CreateCampaignForm } from '@/components/Forms';
import { IMAGES } from '@/assets/images';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { address } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const handleFormSubmit = async (data: any) => {
    if (!address) return;
    setIsSubmitting(true);
    setTxError(null);

    try {
      // Register wallet with AccessControl if first time
      await ensureRegistered(address);

      // Derive slug from title
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Convert ETH string → wei BigInt
      const goalWei = parseEther(data.goalAmount.toString());
      const minWei  = parseEther(data.minContribution.toString());

      // Convert date string "YYYY-MM-DD" → Unix timestamp (seconds)
      const deadline = Math.floor(new Date(data.deadline).getTime() / 1000);

      // Parse tags: split on commas, trim, lowercase, dedupe, drop empty
      const rawTags: string = typeof data.tags === 'string' ? data.tags : '';
      const tags: string[] = rawTags
        ? Array.from(new Set(
            rawTags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
          ))
        : [];

      const contract = await getStartupFund(true);
      const tx = await contract.createCampaign(
        data.title,
        slug,
        data.description,
        data.shortDescription,
        data.imageUrl,
        data.category,
        goalWei,
        minWei,
        deadline,
        data.tokenSymbol,
        tags,
      );
      await tx.wait();

      setShowSuccess(true);
      setTimeout(() => navigate(ROUTE_PATHS.DASHBOARD), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      setTxError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="relative w-24 h-24 mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
            />
            <CheckCircle2 className="w-24 h-24 text-primary relative z-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Campaign Submitted!</h1>
            <p className="text-muted-foreground">
              Your project is being indexed on the blockchain. You will be redirected to your dashboard shortly.
            </p>
          </div>
          <Button 
            onClick={() => navigate(ROUTE_PATHS.DASHBOARD)} 
            className="w-full h-12 text-lg"
          >
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header Section */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={IMAGES.HERO_STARTUP_2} 
            alt="Startup Presentation"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <Button 
              variant="ghost" 
              className="mb-6 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Discover
            </Button>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
              Launch Your <span className="text-primary">Vision</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Pitch your startup to a global network of Web3 investors. 
              Secure funding, build your community, and turn your idea into reality.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Form Content */}
      <section className="container mx-auto px-4 pb-24 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Side */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-8"
          >
            <Card className="border-border/40 shadow-xl backdrop-blur-sm bg-card/80">
              <CardContent className="p-6 md:p-10">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Rocket className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Campaign Details</h2>
                    <p className="text-sm text-muted-foreground">Fill out the information below to start your funding journey.</p>
                  </div>
                </div>

                {txError && (
                  <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                    {txError}
                  </div>
                )}
                <CreateCampaignForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar / Guidelines */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-4 space-y-6"
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Creator Tips
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-3 text-sm">
                    <div className="mt-1 text-primary">
                      <Zap className="w-4 h-4" />
                    </div>
                    <p><span className="font-medium">Clear Pitch:</span> Be concise. Investors spend less than 3 minutes on average reviewing a new campaign.</p>
                  </li>
                  <li className="flex gap-3 text-sm">
                    <div className="mt-1 text-primary">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <p><span className="font-medium">Transparency:</span> Detailed milestones build trust. Show exactly how you'll use the raised funds.</p>
                  </li>
                  <li className="flex gap-3 text-sm">
                    <div className="mt-1 text-primary">
                      <Globe className="w-4 h-4" />
                    </div>
                    <p><span className="font-medium">Web3 Edge:</span> Explain how decentralized technology makes your project unique or more efficient.</p>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Submission FAQ</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      How long does approval take?
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Our platform uses a decentralized verification process. Once submitted to the blockchain, it's live instantly, but curated featured spots may take 24-48 hours.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      Can I edit my campaign later?
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Basic details like descriptions can be updated, but core funding parameters (Goal, Deadline) are locked on the smart contract once the first contribution is made.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-xl border border-dashed border-border flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                All campaigns are secured by audited smart contracts. Funds are only released to creators upon milestone verification.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Need Help Refining Your Pitch?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join our Discord community to get feedback from other entrepreneurs and potential investors before you launch.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline">Join Community</Button>
            <Button variant="ghost">Read Creator Guide</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
