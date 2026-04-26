import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Clock, FastForward, Hammer, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chainTimestamp, chainBlockNumber, warpSeconds, mineBlock } from '@/lib/devRpc';

const PRESETS: { label: string; seconds: number }[] = [
  { label: '+1 min',  seconds: 60 },
  { label: '+10 min', seconds: 600 },
  { label: '+1 hr',   seconds: 3600 },
  { label: '+1 day',  seconds: 86400 },
  { label: '+7 days', seconds: 7 * 86400 },
  { label: '+30 days', seconds: 30 * 86400 },
];

const STORAGE_KEY = 'sf:dev';

export function DevPanel() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(true);
  const [chainTs, setChainTs] = useState<number | null>(null);
  const [chainBlock, setChainBlock] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Activation: ?dev=1 in URL, or localStorage flag persisted from a prior visit.
  const urlOn = params.get('dev') === '1';
  const lsOn  = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1';
  const active = urlOn || lsOn;

  useEffect(() => {
    if (urlOn) localStorage.setItem(STORAGE_KEY, '1');
  }, [urlOn]);

  const refresh = async () => {
    try {
      const [ts, bn] = await Promise.all([chainTimestamp(), chainBlockNumber()]);
      setChainTs(ts);
      setChainBlock(bn);
    } catch (err) {
      console.error('sf:dev:refresh-failed', err);
    }
  };

  useEffect(() => {
    if (!active) return;
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  const fmtChain = chainTs ? new Date(chainTs * 1000).toLocaleString() : '…';
  const skewSec  = chainTs ? Math.floor(Date.now() / 1000) - chainTs : 0;

  const onWarp = async (sec: number, label: string) => {
    setBusy(true);
    try {
      const { before, after } = await warpSeconds(sec);
      toast.success(`Warped ${label}`, {
        description: `${new Date(before * 1000).toLocaleTimeString()} → ${new Date(after * 1000).toLocaleTimeString()}`,
      });
      await refresh();
      window.dispatchEvent(new CustomEvent('sf:dev:warp', { detail: { sec, after } }));
    } catch (err) {
      console.error('sf:dev:warp-failed', err);
      toast.error('Warp failed', { description: String((err as Error)?.message ?? err) });
    } finally {
      setBusy(false);
    }
  };

  const onMine = async () => {
    setBusy(true);
    try {
      const bn = await mineBlock();
      toast.success(`Mined block #${bn}`);
      await refresh();
    } catch (err) {
      toast.error('Mine failed', { description: String((err as Error)?.message ?? err) });
    } finally {
      setBusy(false);
    }
  };

  const onClose = () => {
    localStorage.removeItem(STORAGE_KEY);
    const next = new URLSearchParams(params);
    next.delete('dev');
    setParams(next, { replace: true });
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[320px] rounded-lg border border-amber-500/40 bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono font-semibold tracking-wide text-amber-300">
            DEV PANEL
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-400 hover:text-zinc-100"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-400 hover:text-zinc-100"
            onClick={onClose}
            title="Disable dev panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 p-3">
          <div className="rounded bg-zinc-900 p-2 font-mono text-[11px] leading-relaxed">
            <div className="flex items-center gap-2 text-zinc-300">
              <Clock className="h-3 w-3" />
              <span className="text-zinc-500">chain.timestamp</span>
            </div>
            <div className="ml-5 text-amber-300">{fmtChain}</div>
            <div className="ml-5 text-zinc-500">
              block #{chainBlock ?? '…'} · skew {skewSec}s
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
              Time warp
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onWarp(p.seconds, p.label)}
                  className="h-7 border-zinc-700 bg-zinc-900 text-[11px] font-mono text-zinc-200 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/50"
                >
                  <FastForward className="mr-1 h-3 w-3" />
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={onMine}
              className="h-7 flex-1 border-zinc-700 bg-zinc-900 text-[11px] font-mono text-zinc-200 hover:bg-zinc-800"
            >
              <Hammer className="mr-1 h-3 w-3" />
              Mine block
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={refresh}
              className="h-7 flex-1 border-zinc-700 bg-zinc-900 text-[11px] font-mono text-zinc-200 hover:bg-zinc-800"
            >
              Refresh
            </Button>
          </div>

          <p className="text-[10px] leading-tight text-zinc-500">
            Warps Ganache <span className="font-mono text-zinc-400">block.timestamp</span>.
            Real votes/funds untouched. Use to close voting windows or trip campaign
            deadlines.
          </p>
        </div>
      )}
    </div>
  );
}
