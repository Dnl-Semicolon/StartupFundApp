import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Pencil, CheckCircle2 } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useWallet } from '@/hooks/useWallet';
import { getStartupFund, ensureRegistered } from '@/lib/contracts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

// A lightweight edit form — stores changes in localStorage (overlay on chain data)
// Business rule: editing is only allowed while backersCount === 0

function EditForm({ campaign, onSaved }: { campaign: any; onSaved: () => void }) {
  const [title, setTitle]               = useState(campaign.title);
  const [shortDescription, setShort]    = useState(campaign.shortDescription);
  const [description, setDescription]   = useState(campaign.description);
  const [imageUrl, setImageUrl]         = useState(campaign.imageUrl);
  const [profitReturnRate, setRate]     = useState<string>(String(campaign.profitReturnRate ?? ''));
  const [profitReturnDeadline, setDate] = useState(campaign.profitReturnDeadline ?? '');
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ── Field-by-field validation ─────────────────────────────────────────────
    if (!title.trim() || title.trim().length < 5)
      return setError('Title is required and must be at least 5 characters long.');
    if (!shortDescription.trim() || shortDescription.trim().length < 20)
      return setError('Short description must be at least 20 characters. Please provide more detail.');
    if (shortDescription.trim().length > 160)
      return setError('Short description is too long. Please keep it under 160 characters.');
    if (!description.trim() || description.trim().length < 100)
      return setError('Full description must be at least 100 characters. Please provide more detail about your project.');

    // Profit return rate: must be empty OR a number between 0 and 100 (not negative)
    if (profitReturnRate !== '') {
      const rateNum = parseFloat(profitReturnRate);
      if (isNaN(rateNum) || !isFinite(rateNum))
        return setError('Profit return rate is not a valid number. Please enter a value between 0 and 100, or leave it blank.');
      if (rateNum < 0 || Object.is(rateNum, -0))
        return setError('Profit return rate cannot be negative. Please enter a value between 0 and 100, or leave it blank.');
      if (rateNum > 100)
        return setError('Profit return rate cannot exceed 100%. Please enter a value between 0 and 100.');
    }

    setSaving(true);
    try {
      // Real on-chain edit via StartupFund.editCampaign passthrough.
      // Goal/deadline/min/profit-terms stay locked — only text fields update.
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const tagsArr: string[] = Array.isArray(campaign.tags)
        ? campaign.tags
        : typeof campaign.tags === 'string'
          ? campaign.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
          : [];

      const sf = await getStartupFund(true);
      // Best-effort registration check (creator should already be registered).
      try { await ensureRegistered((sf as unknown as { runner?: { address?: string } }).runner?.address ?? ''); } catch { /* ignored */ }

      const tx = await (sf as unknown as {
        editCampaign: (
          id: bigint, title: string, slug: string, description: string,
          shortDescription: string, imageUrl: string, category: string, tags: string[],
        ) => Promise<{ wait: () => Promise<unknown> }>;
      }).editCampaign(
        BigInt(campaign.id),
        title.trim(),
        slug,
        description.trim(),
        shortDescription.trim(),
        imageUrl.trim(),
        campaign.category,
        tagsArr,
      );
      await tx.wait();
      toast.success('Campaign updated on chain.');
      onSaved();
    } catch (err) {
      console.error('sf:edit:tx-failed', err);
      const raw = err as { shortMessage?: string; reason?: string; message?: string };
      const txt = raw?.shortMessage ?? raw?.reason ?? raw?.message ?? 'Edit failed.';
      const friendly =
        /Already has backers/i.test(txt) ? 'Campaign already has contributors — editing is locked.' :
        /Only creator/i.test(txt)        ? 'Only the campaign creator can edit.' :
        /user rejected|ACTION_REJECTED/i.test(txt) ? 'Transaction cancelled.' :
        txt;
      setError(friendly);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="font-semibold shrink-0">⚠ Invalid input:</span>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Startup Name</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={60}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Elevator Pitch (short description)</label>
            <textarea
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none h-20"
              value={shortDescription}
              onChange={e => setShort(e.target.value)}
              maxLength={160}
            />
            <p className="text-[10px] text-muted-foreground mt-1">{shortDescription.length}/160</p>
          </div>

          <div>
            <label className="text-sm font-medium">Cover Image URL</label>
            <input
              type="url"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />
            {imageUrl && (
              <img src={imageUrl} alt="preview" className="mt-2 h-24 w-full object-cover rounded-md" onError={e => (e.currentTarget.style.display='none')} />
            )}
          </div>

          {/* Profit return — locked once set on chain. Shown for context only. */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Profit Return Rate (%)</label>
              <input
                readOnly
                disabled
                className="mt-1 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm opacity-60"
                value={profitReturnRate || '—'}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Profit Return Deadline</label>
              <input
                readOnly
                disabled
                className="mt-1 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm opacity-60"
                value={profitReturnDeadline ? new Date(profitReturnDeadline).toLocaleDateString() : '—'}
              />
            </div>
            <p className="col-span-2 text-[10px] text-muted-foreground -mt-1">
              Profit-return terms are immutable once set on chain.
            </p>
          </div>
        </div>

        {/* Right column */}
        <div>
          <label className="text-sm font-medium">Full Business Plan / Description</label>
          <textarea
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none h-[260px]"
            value={description}
            onChange={e => setDescription(e.target.value)}
            minLength={100}
          />
          <p className={`text-[10px] mt-1 ${description.trim().length < 100 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {description.trim().length} / 100 characters minimum
            {description.trim().length < 100 && ` — need ${100 - description.trim().length} more`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t">
        <Button type="submit" disabled={saving} className="gap-2">
          <Pencil className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Changes are saved locally and will be visible immediately. Core funding parameters (Goal, Deadline, Category) can only be changed via a new campaign.
        </p>
      </div>
    </form>
  );
}

export default function EditCampaign() {
  const { id }                        = useParams<{ id: string }>();
  const { address }                   = useWallet();
  const { campaigns, loading }        = useCampaigns();
  const navigate                      = useNavigate();
  const [saved, setSaved]             = useState(false);

  const campaign = useMemo(
    () => campaigns.find(c => c.id === id),
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
        <p className="text-muted-foreground">Campaign not found.</p>
        <Link to={ROUTE_PATHS.DASHBOARD} className="text-primary hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const isCreator = address?.toLowerCase() === campaign.creator.walletAddress?.toLowerCase();
  const hasContributors = campaign.backersCount > 0;

  // Success screen
  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <CheckCircle2 className="w-20 h-20 text-primary mx-auto" />
          <div>
            <h1 className="text-2xl font-bold">Changes Saved!</h1>
            <p className="text-muted-foreground mt-1">Your campaign details have been updated.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate(`/campaigns/${campaign.id}`)}>View Campaign</Button>
            <Button variant="outline" onClick={() => navigate(ROUTE_PATHS.DASHBOARD)}>Dashboard</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" className="mb-6 text-muted-foreground" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 w-4 h-4" />
        Back
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Pencil className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Edit Campaign</h1>
          <p className="text-sm text-muted-foreground">{campaign.title}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant="secondary">{campaign.status.toUpperCase()}</Badge>
          <Badge variant="outline">{campaign.backersCount} backers</Badge>
        </div>
      </div>

      {!isCreator ? (
        <Card className="border-destructive/30">
          <CardContent className="flex items-center gap-3 py-6 text-destructive">
            <Lock className="w-5 h-5" />
            <p>Only the campaign creator can edit this campaign.</p>
          </CardContent>
        </Card>
      ) : hasContributors ? (
        <Card className="border-amber-300">
          <CardContent className="flex items-center gap-3 py-6 text-amber-700 dark:text-amber-400">
            <Lock className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Editing is locked</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                This campaign already has {campaign.backersCount} contributor{campaign.backersCount !== 1 ? 's' : ''}. Campaign details cannot be changed once funding has started to protect investor trust.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-2 mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
              <Pencil className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>
                No one has funded this campaign yet — you can freely edit the details below.
                Once the first investor contributes, editing will be permanently locked.
              </span>
            </div>
            <EditForm campaign={campaign} onSaved={() => setSaved(true)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
