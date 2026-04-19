import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { getAccessControl, getReadContract, ACCESS_CONTROL_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES } from '@/lib/contractAddresses';

export type UserRole = 'contributor' | 'both' | null;

const getRoleKey  = (address: string) => `startupfund_role_${address.toLowerCase()}`;
const getNameKey  = (address: string) => `startupfund_name_${address.toLowerCase()}`;
const getEmailKey = (address: string) => `startupfund_email_${address.toLowerCase()}`;
const getBioKey   = (address: string) => `startupfund_bio_${address.toLowerCase()}`;

export function useUserRole() {
  const { address, isConnected, isInitializing } = useWallet();
  const [role, setRole]               = useState<UserRole>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(true);

  // Sync state on wallet change — checks localStorage first, falls back to on-chain
  useEffect(() => {
    // Wallet is still auto-reconnecting — don't resolve yet or ProtectedRoute will redirect
    if (isInitializing) return;

    if (!address || !isConnected) {
      setRole(null);
      setDisplayName(null);
      setIsLoading(false);
      return;
    }

    const syncWithChain = async () => {
      try {
        const storedRole = localStorage.getItem(getRoleKey(address)) as UserRole | null;
        const storedName = localStorage.getItem(getNameKey(address));

        if (storedRole) {
          // localStorage has data — use it
          setRole(storedRole);
          setDisplayName(storedName);
          return;
        }

        // localStorage empty — query on-chain (e.g. cache cleared or new browser)
        const ac = getReadContract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI);
        const onChainRegistered = await ac.isRegistered(address) as boolean;
        if (!onChainRegistered) return;

        const onChainName         = await ac.getDisplayName(address) as string;
        const onChainEntrepreneur = await ac.isEntrepreneur(address) as boolean;
        const derivedRole: UserRole = onChainEntrepreneur ? 'both' : 'contributor';

        // Restore localStorage from chain
        localStorage.setItem(getRoleKey(address), derivedRole);
        localStorage.setItem(getNameKey(address), onChainName);

        setRole(derivedRole);
        setDisplayName(onChainName);
      } catch {
        // Chain read failed (Ganache not running etc.) — stay null
      } finally {
        setIsLoading(false);
      }
    };

    syncWithChain();
  }, [address, isConnected, isInitializing]);

  // Sends register(displayName) tx on-chain, then saves email/bio to localStorage
  const register = useCallback(async (name: string, email?: string, bio?: string) => {
    if (!address) throw new Error('Wallet not connected');

    const ac = await getAccessControl(true);
    const tx = await (ac as any).register(name);
    await tx.wait();

    localStorage.setItem(getRoleKey(address), 'contributor');
    localStorage.setItem(getNameKey(address), name);
    if (email) localStorage.setItem(getEmailKey(address), email);
    if (bio)   localStorage.setItem(getBioKey(address),   bio);

    setRole('contributor');
    setDisplayName(name);
  }, [address]);

  // Sends becomeEntrepreneur() tx on-chain, then updates localStorage
  const upgradeToEntrepreneur = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected');

    const ac = await getAccessControl(true);
    const tx = await (ac as any).becomeEntrepreneur();
    await tx.wait();

    localStorage.setItem(getRoleKey(address), 'both');
    setRole('both');
  }, [address]);

  return {
    role,
    displayName,
    isLoading,
    isRegistered:   role !== null,
    isContributor:  role === 'contributor' || role === 'both',
    isEntrepreneur: role === 'both',
    register,
    upgradeToEntrepreneur,
  };
}
