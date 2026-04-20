import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getStartupFund } from '@/lib/contracts';
import { useWallet } from '@/hooks/useWallet';
import { useCampaigns } from '@/hooks/useCampaigns';
import { ROUTE_PATHS, CAMPAIGN_STATUS } from '@/lib/index';
import { EditCampaignForm } from '@/components/Forms';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EditCampaign() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address } = useWallet();
  const { campaigns, loading } = useCampaigns();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const campaign = useMemo(
    () => campaigns.find(c => c.id === id || c.slug === id),
    [campaigns, id]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">Campaign Not Found</h1>
        <Link to={ROUTE_PATHS.DASHBOARD} className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const isCreator = address?.toLowerCase() === campaign.creator.walletAddress?.toLowerCase();

  if (!isCreator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Lock className="w-12 h-12 text-muted-foreground opacity-30" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Only the campaign creator can edit this campaign.</p>
        <Link to={ROUTE_PATHS.DASHBOARD} className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  if (campaign.backersCount > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <Lock className="w-12 h-12 text-muted-foreground opacity-30" />
        <h1 className="text-2xl font-bold">Campaign Locked</h1>
        <p className="text-muted-foreground max-w-sm">
          This campaign already has {campaign.backersCount} contributor{campaign.backersCount > 1 ? 's' : ''}.
          Campaign details cannot be edited once funding has started.
        </p>
        <Button variant="outline" asChild>
          <Link to={`/campaigns/${campaign.id}`} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> View Campaign
          </Link>
        </Button>
      </div>
    );
  }

  if (campaign.status !== CAMPAIGN_STATUS.ACTIVE) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <Lock className="w-12 h-12 text-muted-foreground opacity-30" />
        <h1 className="text-2xl font-bold">Campaign Not Editable</h1>
        <p className="text-muted-foreground">Only active campaigns can be edited.</p>
        <Link to={ROUTE_PATHS.DASHBOARD} className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleSubmit = async (data: {
    title: string;
    description: string;
    shortDescription: string;
    imageUrl: string;
  }) => {
    if (!address) return;
    setIsSubmitting(true);
    setTxError(null);
    try {
      const contract = await getStartupFund(true);
      const tx = await contract.updateCampaign(
        BigInt(campaign.id),
        data.title,
        data.description,
        data.shortDescription,
        data.imageUrl,
      );
      await tx.wait();
      setShowSuccess(true);
      setTimeout(() => navigate(ROUTE_PATHS.DASHBOARD), 2500);
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Pencil className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Campaign Updated</h1>
          <p className="text-muted-foreground">Changes saved to the blockchain. Redirecting to dashboard…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Button variant="ghost" className="mb-6 text-muted-foreground" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 w-4 h-4" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Edit Campaign</h1>
            <p className="text-sm text-muted-foreground">"{campaign.title}"</p>
          </div>
        </div>

        {txError && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            {txError}
          </div>
        )}

        <Card>
          <CardContent className="p-6 md:p-8">
            <EditCampaignForm
              defaultValues={{
                title:            campaign.title,
                shortDescription: campaign.shortDescription,
                description:      campaign.description,
                imageUrl:         campaign.imageUrl,
              }}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
