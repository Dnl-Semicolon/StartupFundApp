import { JsonRpcProvider } from 'ethers';

// Direct admin provider — bypasses MetaMask. Hits Ganache via the same Vite
// proxy used by the read-only provider. Required for evm_* methods which
// MetaMask refuses to forward.
const RPC_URL =
  import.meta.env.DEV
    ? `${window.location.origin}/ganache-rpc`
    : 'http://127.0.0.1:7545';

const provider = () => new JsonRpcProvider(RPC_URL);

export async function chainTimestamp(): Promise<number> {
  const block = await provider().getBlock('latest');
  return block?.timestamp ?? 0;
}

export async function chainBlockNumber(): Promise<number> {
  return provider().getBlockNumber();
}

/** Advance Ganache's evm_increaseTime + mine a block so block.timestamp moves. */
export async function warpSeconds(seconds: number): Promise<{ before: number; after: number }> {
  const p = provider();
  const before = (await p.getBlock('latest'))?.timestamp ?? 0;
  await p.send('evm_increaseTime', [seconds]);
  await p.send('evm_mine', []);
  const after = (await p.getBlock('latest'))?.timestamp ?? 0;
  return { before, after };
}

/** Mine a single empty block. Useful to force timestamp re-read after settle attempts. */
export async function mineBlock(): Promise<number> {
  const p = provider();
  await p.send('evm_mine', []);
  return p.getBlockNumber();
}
