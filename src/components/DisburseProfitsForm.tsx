import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, CheckCircle2, Loader2, Send, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Campaign } from '@/lib/index';
import { useContributors } from '@/hooks/useContributors';
import { executePayouts } from '@/lib/directTransfer';
import { recordDisbursement } from '@/lib/demoState';
import { toast } from 'sonner';

interface DisburseProfitsFormProps {
  campaign: Campaign;
  onDone?:  () => void;
}

/**
 * Creator-facing disbursement modal. Computes per-contributor payouts from
 * their contribution × (1 + bonus%) — default bonus comes from the campaign's
 * promised profitReturnRate, or 10% if none was set. Creator can override the
 * rate. On confirm, executes N sequential wallet-to-wallet ETH transfers.
 * On success, marks campaign as disbursed in demoState.
 */
export function DisburseProfitsForm({ campaign, onDone }: DisburseProfitsFormProps) {
  const { contributors, loading } = useContributors(campaign);
  const [bonusRate, setBonusRate] = useState<number>(campaign.profitReturnRate ?? 10);
  const [sending, setSending]     = useState(false);
  const [done, setDone]           = useState(false);
  const [progress, setProgress]   = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  const payouts = useMemo(() => {
    return contributors.map(c => ({
      to:     c.address,
      amount: Number((c.amount * (1 + bonusRate / 100)).toFixed(6)),
      label:  `${c.address.slice(0, 6)}…${c.address.slice(-4)}`,
      principal: c.amount,
      bonus:     Number((c.amount * (bonusRate / 100)).toFixed(6)),
    }));
  }, [contributors, bonusRate]);

  const totalOutflow = useMemo(
    () => payouts.reduce((sum, p) => sum + p.amount, 0),
    [payouts]
  );

  const handleDisburse = async () => {
    if (payouts.length === 0) {
      toast.error('No contributors to pay.');
      return;
    }
    setSending(true);
    setProgress({ done: 0, total: payouts.length });
    try {
      await executePayouts(
        payouts.map(p => ({ to: p.to, amount: p.amount, label: p.label })),
        (d, t) => setProgress({ done: d, total: t }),
      );
      // Record disbursement overlay so UI swaps to "disbursed" state
      const payoutMap: Record<string, number> = {};
      for (const p of payouts) payoutMap[p.to.toLowerCase()] = p.amount;
      recordDisbursement(campaign.id, payoutMap);
      setDone(true);
      toast.success(`All ${payouts.length} contributors paid.`);
      onDone?.();
    } catch {
      // executePayouts toasts the failing tx itself
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-6 text-center space-y-3"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
        <h3 className="font-semibold text-emerald-400">Disbursement Complete</h3>
        <p className="text-sm text-muted-foreground">
          {payouts.length} contributor{payouts.length !== 1 ? 's' : ''} received a total of{' '}
          <span className="font-mono text-foreground">{totalOutflow.toFixed(4)} ETH</span>.
        </p>
      </motion.div>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          Disburse Profits
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Pay back contributors with your promised bonus. Each payout is a direct wallet-to-wallet transfer.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Bonus rate (%)</label>
          <Input
            type="number"
            min={0}
            max={200}
            step={0.5}
            value={bonusRate}
            onChange={(e) => setBonusRate(Math.max(0, Number(e.target.value) || 0))}
            disabled={sending}
          />
          {campaign.profitReturnRate !== undefined && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Promised at launch: {campaign.profitReturnRate}%
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg border border-border/60 bg-secondary/30">
            <AlertTriangle className="w-4 h-4" />
            No contributors found for this campaign.
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border/60 bg-secondary/20 divide-y divide-border/40 max-h-64 overflow-y-auto">
              {payouts.map((p) => (
                <div key={p.to} className="px-3 py-2 flex items-center justify-between text-xs">
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-muted-foreground truncate">{p.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      contributed {p.principal.toFixed(4)} ETH
                    </span>
                  </div>
                  <div className="text-right shrink-0 pl-3">
                    <div className="font-semibold tabular-nums text-emerald-400">
                      {p.amount.toFixed(4)} ETH
                    </div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">
                      +{p.bonus.toFixed(4)} bonus
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <span className="text-muted-foreground">Total outflow</span>
              <Badge className="bg-primary/20 text-primary border-primary/30 tabular-nums">
                {totalOutflow.toFixed(4)} ETH
              </Badge>
            </div>

            {sending && (
              <div className="space-y-1">
                <Progress value={(progress.done / Math.max(1, progress.total)) * 100} className="h-1" />
                <p className="text-[11px] text-muted-foreground text-center">
                  Sending {progress.done}/{progress.total}…
                </p>
              </div>
            )}

            <Button
              onClick={handleDisburse}
              disabled={sending || payouts.length === 0}
              className="w-full"
            >
              {sending
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Disbursing…</>
                : <><Send className="w-4 h-4 mr-2" /> Disburse {totalOutflow.toFixed(4)} ETH</>
              }
            </Button>

            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              MetaMask will prompt once per contributor. You can cancel mid-batch —
              earlier payouts will have already completed.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
