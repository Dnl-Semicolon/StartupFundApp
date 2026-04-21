import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { getReadContract, getWriteContract, ACCESS_CONTROL_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES } from '@/lib/contractAddresses';
import { toast } from 'sonner';

// Module-level flag — prevents duplicate MetaMask popups when hook
// is instantiated in multiple components simultaneously.
let txInFlight = false;

// Scope cache by AccessControl address so a fresh contract redeploy
// automatically invalidates every wallet's cached registration flag.
// Old keys `sf_registered_<wallet>` become dead entries — harmless but
// cleared on first fresh wallet connect to keep localStorage tidy.
const cacheKey = (address: string) =>
  `sf_registered_${CONTRACT_ADDRESSES.accessControl.toLowerCase()}_${address.toLowerCase()}`;

const legacyCacheKey = (address: string) => `sf_registered_${address.toLowerCase()}`;

export function useRegistration() {
  const { address, isConnected, isInitializing } = useWallet();
  const [isRegistered, setIsRegistered]   = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading]         = useState(true);

  useEffect(() => {
    if (isInitializing) return;

    if (!isConnected || !address) {
      setIsRegistered(false);
      setIsLoading(false);
      return;
    }

    // One-time legacy-cache cleanup — prevents stale "true" flags from
    // previous contract deploys from leaking into the new deploy.
    localStorage.removeItem(legacyCacheKey(address));

    // localStorage cache hit (current contract) — skip chain read
    if (localStorage.getItem(cacheKey(address)) === 'true') {
      setIsRegistered(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const ac = getReadContract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI);
    (ac.isRegistered(address) as Promise<boolean>)
      .then(registered => {
        if (registered) localStorage.setItem(cacheKey(address), 'true');
        setIsRegistered(registered);
      })
      .catch(() => { /* Ganache offline — stay false */ })
      .finally(() => setIsLoading(false));
  }, [address, isConnected, isInitializing]);

  // auto=true for silent background fire on wallet connect; auto=false for retry button
  const register = useCallback(async (auto = false) => {
    if (!address || isRegistered || txInFlight) return;
    txInFlight = true;
    setIsRegistering(true);
    const toastId = toast.loading(
      auto ? 'Setting up your account…' : 'Completing account setup…'
    );
    try {
      const ac = await getWriteContract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI);
      const tx = await (ac as any).register();
      await tx.wait();
      localStorage.setItem(cacheKey(address), 'true');
      setIsRegistered(true);
      toast.success('Account ready — you can now create and fund campaigns.', { id: toastId });
    } catch (err: any) {
      const userRejected = err?.code === 4001 || err?.code === 'ACTION_REJECTED';
      // Contract reverts with "Already registered" when the wallet is already
      // set up on-chain but our localStorage cache was missing. Treat that as
      // success — no error toast, no noise.
      const msg = (err?.message || err?.data?.message || err?.reason || '') as string;
      const alreadyRegistered = /already[\s-]?registered/i.test(msg);

      if (alreadyRegistered) {
        localStorage.setItem(cacheKey(address), 'true');
        setIsRegistered(true);
        toast.dismiss(toastId);
        // Do not show any toast — this is a silent reconciliation.
      } else if (userRejected) {
        toast.error('Setup skipped. Use the "Complete Setup" button when ready.', { id: toastId });
      } else {
        toast.error('Setup failed. Check MetaMask and try again.', { id: toastId });
      }
    } finally {
      txInFlight = false;
      setIsRegistering(false);
    }
  }, [address, isRegistered]);

  return { isRegistered, isRegistering, isLoading, register };
}
