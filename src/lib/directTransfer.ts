// ─────────────────────────────────────────────────────────────────────────────
// directTransfer — plain ETH transfers (wallet-to-wallet) via MetaMask signer.
// Used by demo flows that bypass contracts (disbursement, reclaim) but still
// need real on-chain ETH movement so Ganache + MetaMask show real balance
// deltas in screenshots.
// ─────────────────────────────────────────────────────────────────────────────

import { BrowserProvider, parseEther } from 'ethers';
import { toast } from 'sonner';
// window.ethereum is already declared globally in src/hooks/useWallet.ts —
// don't redeclare here (conflicting shape would break type-check).

export interface Payout {
  to: string;
  /** Amount in ETH (will be converted to wei) */
  amount: number;
  /** Optional label for progress toasts */
  label?: string;
}

export interface TransferResult {
  to: string;
  amount: number;
  txHash: string;
}

/**
 * Execute N plain ETH transfers sequentially from the currently-connected
 * MetaMask signer. Each tx pops MetaMask for Confirm. Cheap, no contract.
 *
 * Caller pattern: pass full list, get results array on success. Throws on
 * first user-reject or chain failure (stops mid-list — caller can retry).
 */
export async function executePayouts(
  payouts: Payout[],
  onProgress?: (done: number, total: number) => void,
): Promise<TransferResult[]> {
  if (!window.ethereum) throw new Error('MetaMask not found');
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const results: TransferResult[] = [];
  const total = payouts.length;

  for (let i = 0; i < payouts.length; i++) {
    const p = payouts[i];
    const label = p.label ?? `${p.to.slice(0, 6)}…${p.to.slice(-4)}`;
    const toastId = toast.loading(
      `Payout ${i + 1}/${total} → ${label}: ${p.amount.toFixed(4)} ETH`
    );
    try {
      const tx = await signer.sendTransaction({
        to:    p.to,
        value: parseEther(p.amount.toString()),
      });
      await tx.wait();
      results.push({ to: p.to, amount: p.amount, txHash: tx.hash });
      toast.success(`Sent ${p.amount.toFixed(4)} ETH to ${label}`, { id: toastId });
      onProgress?.(i + 1, total);
    } catch (err: unknown) {
      const e = err as { code?: number | string; message?: string };
      const userRejected = e?.code === 4001 || e?.code === 'ACTION_REJECTED';
      toast.error(
        userRejected
          ? `Cancelled at payout ${i + 1}/${total}. Earlier payouts already sent.`
          : `Payout ${i + 1}/${total} failed.`,
        { id: toastId }
      );
      throw err;
    }
  }

  return results;
}

/** Single-shot wallet-to-wallet transfer. */
export async function sendDirect(to: string, amountETH: number): Promise<string> {
  const res = await executePayouts([{ to, amount: amountETH }]);
  return res[0].txHash;
}
