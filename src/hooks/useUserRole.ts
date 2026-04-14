import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';

export type UserRole = 'contributor' | 'both' | null;

const getRoleKey  = (address: string) => `startupfund_role_${address.toLowerCase()}`;
const getNameKey  = (address: string) => `startupfund_name_${address.toLowerCase()}`;

export function useUserRole() {
  const { address, isConnected } = useWallet();
  const [role, setRole]               = useState<UserRole>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Sync state whenever the connected address changes
  useEffect(() => {
    if (!address || !isConnected) {
      setRole(null);
      setDisplayName(null);
      return;
    }
    const storedRole = localStorage.getItem(getRoleKey(address)) as UserRole | null;
    const storedName = localStorage.getItem(getNameKey(address));
    setRole(storedRole ?? null);
    setDisplayName(storedName ?? null);
  }, [address, isConnected]);

  // Called on the Register page — saves 'contributor' as the default role
  const register = useCallback((name?: string) => {
    if (!address) return;
    localStorage.setItem(getRoleKey(address), 'contributor');
    if (name) localStorage.setItem(getNameKey(address), name);
    setRole('contributor');
    if (name) setDisplayName(name);
  }, [address]);

  // Called on the Entrepreneur page — upgrades role to 'both'
  const upgradeToEntrepreneur = useCallback(() => {
    if (!address) return;
    localStorage.setItem(getRoleKey(address), 'both');
    setRole('both');
  }, [address]);

  return {
    role,
    displayName,
    isRegistered:    role !== null,
    isContributor:   role === 'contributor' || role === 'both',
    isEntrepreneur:  role === 'both',
    register,
    upgradeToEntrepreneur,
  };
}
