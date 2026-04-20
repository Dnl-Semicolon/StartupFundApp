import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { getReadContract, getWriteContract, ACCESS_CONTROL_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES } from '@/lib/contractAddresses';
import { toast } from 'sonner';

// Module-level flag — prevents duplicate MetaMask popups when hook
// is instantiated in multiple components simultaneously.
let txInFlight = false;

const cacheKey = (address: string) => `sf_registered_${address.toLowerCase()}`;

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

    // localStorage cache hit — skip chain read
    if (localStorage.getItem(cacheKey(address)) === 'true') {
      setIsRegistered(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const ac = getReadContract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI);
    (ac.isRegistered(address) as Promise<boolean>)
      .then(registered => {
        if (registered) {
          localStorage.setItem(cacheKey(address), 'true');
          setIsRegistered(true);
        } else {
          // Chain confirmed not registered — clear stale cache
          localStorage.removeItem(cacheKey(address));
          setIsRegistered(false);
        }
      })
      .catch(() => {
        // Ganache offline or wrong network — fall back to localStorage cache
        const cached = localStorage.getItem(cacheKey(address)) === 'true';
        setIsRegistered(cached);
      })
      .finally(() => setIsLoading(false));
  }, [address, isConnected, isInitializing]);

  // auto=true for silent background fire on wallet connect; auto=false for retry button
  const register = useCallback(async (auto = false) => {
    if (!address || isRegistered || txInFlight) return;
    txInFlight = true;
    setIsRegistering(true);
    const toastId = toast.loading(
      auto ? 'Setting up your account…' : 'Checking registration…'
    );
    try {
      // Always verify on-chain first — wallet may already be registered
      // (e.g. setup script registered it, or user was on wrong network earlier)
      const ac = getReadContract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI);
      const alreadyRegistered = await (ac.isRegistered(address) as Promise<boolean>);

      if (alreadyRegistered) {
        // Already registered on-chain — just sync local state, no tx needed
        localStorage.setItem(cacheKey(address), 'true');
        setIsRegistered(true);
        toast.success('Account ready — you can now create and fund campaigns.', { id: toastId });
        return;
      }

      // Not yet registered — send the on-chain tx
      toast.loading('Registering your wallet…', { id: toastId });
      const acWrite = await getWriteContract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI);
      const tx = await (acWrite as any).register();
      await tx.wait();
      localStorage.setItem(cacheKey(address), 'true');
      setIsRegistered(true);
      toast.success('Account ready — you can now create and fund campaigns.', { id: toastId });
    } catch (err: any) {
      const userRejected = err?.code === 4001 || err?.code === 'ACTION_REJECTED';
      // Handle "already registered" revert gracefully
      const alreadyRegisteredRevert =
        typeof err?.message === 'string' && err.message.includes('already registered');

      if (alreadyRegisteredRevert) {
        localStorage.setItem(cacheKey(address), 'true');
        setIsRegistered(true);
        toast.success('Account ready.', { id: toastId });
      } else {
        toast.error(
          userRejected
            ? 'Setup skipped. Use the "Register" button when ready.'
            : 'Registration failed — make sure MetaMask is on Ganache (Chain ID 1337) and Ganache is running.',
          { id: toastId }
        );
      }
    } finally {
      txInFlight = false;
      setIsRegistering(false);
    }
  }, [address, isRegistered]);

  return { isRegistered, isRegistering, isLoading, register };
}
