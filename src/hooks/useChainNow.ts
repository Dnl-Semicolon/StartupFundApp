import { useEffect, useState } from 'react';
import { chainTimestamp } from '@/lib/devRpc';

/**
 * Returns the current chain time in unix seconds, refreshed every second.
 *
 * Strategy:
 *   - On mount and on `sf:dev:warp` events, fetch chain.timestamp and compute
 *     an offset (chainSec - wallSec).
 *   - Tick every second using `wallNow + offset` so we don't hammer the RPC.
 *
 * This keeps the UI in sync with Ganache's clock even when the dev panel
 * fast-forwards block.timestamp ahead of wall-clock.
 */
export function useChainNow(): number {
  const [offset, setOffset] = useState(0);
  const [now,    setNow]    = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      try {
        const chainTs = await chainTimestamp();
        if (cancelled || !chainTs) return;
        setOffset(chainTs - Math.floor(Date.now() / 1000));
      } catch {
        // RPC unreachable — keep last known offset (may be stale during outage)
      }
    };
    sync();
    const onWarp = () => sync();
    window.addEventListener('sf:dev:warp', onWarp);
    return () => {
      cancelled = true;
      window.removeEventListener('sf:dev:warp', onWarp);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000) + offset);
    }, 1000);
    return () => clearInterval(id);
  }, [offset]);

  return now;
}
