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
      console.debug('[sf:reg] no wallet — isRegistered=false');
      setIsRegistered(false);
      setIsLoading(false);
      return;
    }

    // One-time legacy-cache cleanup — prevents stale "true" flags from
    // previous contract deploys from leaking into the new deploy.
    localStorage.removeItem(legacyCacheKey(address));

    // localStorage cache hit (current contract) — skip chain read
    if (localStorage.getItem(cacheKey(address)) === 'true') {
      console.debug('[sf:reg] cache hit — isRegistered=true', address);
      setIsRegistered(true);
      setIsLoading(false);
      return;
    }

    console.debug('[sf:reg] cache miss — reading chain', address);
    setIsLoading(true);
    const ac = getReadContract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI);
    (ac.isRegistered(address) as Promise<boolean>)
      .then(registered => {
        console.debug('[sf:reg] chain says registered =', registered, address);
        if (registered) localStorage.setItem(cacheKey(address), 'true');
        setIsRegistered(registered);
      })
      .catch(err => {
        console.warn('[sf:reg] chain read failed (Ganache offline?)', err?.message ?? err);
      })
      .finally(() => setIsLoading(false));
  }, [address, isConnected, isInitializing]);

  // auto=true for silent background fire on wallet connect; auto=false for retry button
  const register = useCallback(async (auto = false) => {
    if (!address || isRegistered || txInFlight) {
      console.debug('[sf:reg] register() skip', { address, isRegistered, txInFlight });
      return;
    }
    txInFlight = true;
    setIsRegistering(true);

    // Just-in-time chain re-check — avoids the entire revert path when the
    // wallet was registered in a previous session but localStorage is empty.
    // This is cheaper and more reliable than parsing the revert reason out
    // of ethers v6's nested error wrapping after the tx fails.
    try {
      const acRead = getReadContract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI);
      const already = await (acRead.isRegistered(address) as Promise<boolean>);
      if (already) {
        console.debug('[sf:reg] pre-check: wallet already on-chain registered — skipping tx');
        localStorage.setItem(cacheKey(address), 'true');
        setIsRegistered(true);
        txInFlight = false;
        setIsRegistering(false);
        return;
      }
    } catch (err: any) {
      console.warn('[sf:reg] pre-check read failed — proceeding with tx attempt', err?.message ?? err);
    }

    const toastId = toast.loading(
      auto ? 'Setting up your account…' : 'Completing account setup…'
    );
    try {
      console.debug('[sf:reg] sending register() tx');
      const ac = await getWriteContract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI);
      const tx = await (ac as any).register();
      await tx.wait();
      localStorage.setItem(cacheKey(address), 'true');
      setIsRegistered(true);
      toast.success('Account ready — you can now create and fund campaigns.', { id: toastId });
    } catch (err: any) {
      // Harvest revert reason from every place ethers v6 might bury it.
      const msg = String(
        err?.shortMessage ??
        err?.reason ??
        err?.data?.message ??
        err?.info?.error?.message ??
        err?.error?.message ??
        err?.message ??
        ''
      );
      const userRejected = err?.code === 4001 || err?.code === 'ACTION_REJECTED';
      const alreadyRegistered = /already[\s-]?registered/i.test(msg);

      console.debug('[sf:reg] register() failed', { userRejected, alreadyRegistered, msg });

      if (alreadyRegistered) {
        // Contract state says registered; cache it and go silent.
        localStorage.setItem(cacheKey(address), 'true');
        setIsRegistered(true);
        toast.dismiss(toastId);
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
