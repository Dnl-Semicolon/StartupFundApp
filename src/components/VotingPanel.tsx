import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ThumbsUp, ThumbsDown, Clock, Users,
  CheckCircle2, XCircle, Loader2, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVoting } from '@/hooks/useVoting';
import { useWallet } from '@/hooks/useWallet';
import { useRegistration } from '@/hooks/useRegistration';
import { useChainNow } from '@/hooks/useChainNow';
import { fadeInUp } from '@/lib/motion';

interface VotingPanelProps {
  campaignId: string;
  /** Creator wallet — if it matches the connected wallet, vote buttons are disabled. */
  creatorAddress?: string;
}

function fmtCountdown(secs: number): string {
  if (secs <= 0) return 'Closed';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function VotingPanel({ campaignId, creatorAddress }: VotingPanelProps) {
  const { isConnected, address }  = useWallet();
  const { isRegistered } = useRegistration();
  const {
    voteStatus, hasVoted, userVote,
    isLoading, isTxPending,
    vote, settle, isDemo,
  } = useVoting(campaignId);

  const windowEnd  = voteStatus?.windowEnd ?? 0;
  const chainNow   = useChainNow();
  const remaining  = Math.max(0, windowEnd - chainNow);
  const windowOpen = remaining > 0 && !voteStatus?.isSettled;
  const canSettle  = !windowOpen && !voteStatus?.isSettled && voteStatus !== null;
  const isCreator  = !!address && !!creatorAddress &&
                     address.toLowerCase() === creatorAddress.toLowerCase();
  const canVote    = isConnected && isRegistered && !isCreator &&
                     windowOpen && !hasVoted && !voteStatus?.isSettled;

  if (isLoading) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate">
      <Card className="relative overflow-hidden border-amber-500/25 bg-amber-500/5 shadow-lg shadow-amber-500/5">
        {/* Decorative glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <CardHeader className="pb-3 relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Community Vote
              {isDemo && (
                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  demo
                </span>
              )}
            </CardTitle>
            <Badge
              variant="outline"
              className={windowOpen
                ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                : voteStatus?.isSettled
                  ? 'border-border text-muted-foreground'
                  : 'border-orange-500/40 text-orange-400 bg-orange-500/10'
              }
            >
              {voteStatus?.isSettled ? 'Settled' : windowOpen ? 'Voting Open' : 'Window Closed'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This campaign needs community approval before it can accept contributions.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 relative">
          {/* Countdown */}
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              {voteStatus?.isSettled
                ? 'Voting finalized.'
                : windowOpen
                  ? 'Closes in'
                  : 'Voting window has closed.'}
            </span>
            {!voteStatus?.isSettled && windowOpen && (
              <span className="font-mono font-semibold text-amber-400 tabular-nums">
                {fmtCountdown(remaining)}
              </span>
            )}
          </div>

          {/* Tally */}
          {voteStatus && (
            <>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Approval rate</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {voteStatus.total > 0
                      ? `${voteStatus.approvePct}% · ${voteStatus.total} vote${voteStatus.total === 1 ? '' : 's'}`
                      : 'No votes yet'}
                  </span>
                </div>
                <Progress
                  value={voteStatus.approvePct}
                  className="h-2 bg-secondary"
                />
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="flex items-center gap-1 text-emerald-400 tabular-nums">
                    <ThumbsUp className="w-3 h-3" /> {voteStatus.approves} approve
                  </span>
                  <span className="flex items-center gap-1 text-red-400 tabular-nums">
                    {voteStatus.disapproves} disapprove <ThumbsDown className="w-3 h-3" />
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Passes on <span className="text-foreground font-medium">≥70% approval</span> with quorum met,
                or auto-activates if no votes cast.
              </p>
            </>
          )}

          {/* Already voted */}
          {hasVoted && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
              userVote
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {userVote
                ? <><CheckCircle2 className="w-4 h-4 shrink-0" /> You voted to approve.</>
                : <><XCircle className="w-4 h-4 shrink-0" /> You voted to disapprove.</>
              }
            </div>
          )}

          {/* Creator can't vote on own campaign */}
          {isCreator && windowOpen && !voteStatus?.isSettled && (
            <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-secondary/50 text-muted-foreground border border-border">
              <Users className="w-4 h-4 shrink-0" />
              You created this campaign — you can&apos;t vote on yourself.
            </div>
          )}

          {/* Vote buttons */}
          {!hasVoted && windowOpen && !isCreator && (
            canVote ? (
              <div className="flex gap-2">
                <Button
                  onClick={() => vote(true)}
                  disabled={isTxPending}
                  variant="outline"
                  className="flex-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60 hover:text-emerald-300"
                >
                  {isTxPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><ThumbsUp className="w-4 h-4 mr-1.5" /> Approve</>}
                </Button>
                <Button
                  onClick={() => vote(false)}
                  disabled={isTxPending}
                  variant="outline"
                  className="flex-1 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 hover:text-red-300"
                >
                  {isTxPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><ThumbsDown className="w-4 h-4 mr-1.5" /> Disapprove</>}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-1">
                {!isConnected
                  ? 'Connect wallet to vote.'
                  : !isRegistered
                    ? 'Complete account setup to vote.'
                    : 'Voting not available.'}
              </p>
            )
          )}

          {/* Finalize button */}
          {canSettle && (
            <Button
              onClick={settle}
              disabled={isTxPending}
              variant="outline"
              className="w-full bg-amber-500/15 text-amber-400 border-amber-500/40 hover:bg-amber-500/25 hover:text-amber-300"
            >
              {isTxPending
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Finalizing…</>
                : <><Sparkles className="w-4 h-4 mr-2" /> Finalize Vote — Activate or Reject</>
              }
            </Button>
          )}

        </CardContent>
      </Card>
    </motion.div>
  );
}
