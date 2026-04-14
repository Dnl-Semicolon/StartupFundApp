import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, formatEther } from 'ethers';
import { CHAIN_ID } from '@/lib/contractAddresses';

// Tell TypeScript that window.ethereum exists (injected by MetaMask)
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string;
  isConnecting: boolean;
  error: string | null;
}

const getProvider = () => {
  if (!window.ethereum) return null;
  return new BrowserProvider(window.ethereum);
};

const fetchBalance = async (address: string): Promise<string> => {
  const provider = getProvider();
  if (!provider) return '0.00';
  const raw = await provider.getBalance(address);
  return parseFloat(formatEther(raw)).toFixed(4);
};

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: '0.00',
    isConnecting: false,
    error: null,
  });

  // True while the silent auto-reconnect is in flight on page load.
  // Prevents ProtectedRoute from redirecting before wallet state is known.
  const [isInitializing, setIsInitializing] = useState(
    localStorage.getItem('startupfund_wallet_connected') === 'true'
  );

  // ── Connect ──────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (state.isConnecting) return;

    if (!window.ethereum) {
      setState(prev => ({ ...prev, error: 'MetaMask not found. Please install it.' }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Prompt MetaMask popup — user approves/rejects here
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!accounts || accounts.length === 0) throw new Error('No accounts returned');

      const address = accounts[0];
      const provider = getProvider()!;
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const balance = await fetchBalance(address);

      setState({
        isConnected: true,
        address,
        chainId,
        balance,
        isConnecting: false,
        error: null,
      });

      localStorage.setItem('startupfund_wallet_connected', 'true');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection rejected';
      setState(prev => ({ ...prev, isConnecting: false, error: msg }));
    }
  }, [state.isConnecting]);

  // ── Disconnect ───────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      chainId: null,
      balance: '0.00',
      isConnecting: false,
      error: null,
    });
    localStorage.removeItem('startupfund_wallet_connected');
  }, []);

  // ── signTransaction (kept for API compatibility) ─────────────
  // In real usage, callers use ethers contract methods directly.
  // This method remains so existing callers don't break.
  const signTransaction = useCallback(async (details: { to: string; amount: number; data?: string }) => {
    if (!state.isConnected || !state.address) throw new Error('Wallet not connected');
    const provider = getProvider();
    if (!provider) throw new Error('No provider');
    const signer = await provider.getSigner();
    const tx = await signer.sendTransaction({
      to: details.to,
      value: BigInt(Math.floor(details.amount * 1e18)),
      data: details.data ?? '0x',
    });
    return { hash: tx.hash, status: 'success' };
  }, [state.isConnected, state.address]);

  // ── Auto-reconnect on page load ──────────────────────────────
  useEffect(() => {
    const wasConnected = localStorage.getItem('startupfund_wallet_connected') === 'true';
    if (wasConnected && !state.isConnected && window.ethereum) {
      // Use eth_accounts (no popup) to silently restore session
      window.ethereum.request({ method: 'eth_accounts' }).then(async (accounts) => {
        const list = accounts as string[];
        if (list.length === 0) {
          localStorage.removeItem('startupfund_wallet_connected');
          setIsInitializing(false);
          return;
        }
        const address = list[0];
        const provider = getProvider()!;
        const network = await provider.getNetwork();
        const balance = await fetchBalance(address);
        setState({
          isConnected: true,
          address,
          chainId: Number(network.chainId),
          balance,
          isConnecting: false,
          error: null,
        });
        setIsInitializing(false);
      }).catch(() => {
        localStorage.removeItem('startupfund_wallet_connected');
        setIsInitializing(false);
      });
    } else {
      // Not expecting a reconnect — no initialization needed
      setIsInitializing(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── MetaMask event listeners ─────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: unknown) => {
      const list = accounts as string[];
      if (list.length === 0) {
        disconnect();
      } else {
        const address = list[0];
        const balance = await fetchBalance(address);
        setState(prev => ({ ...prev, address, balance }));
      }
    };

    const handleChainChanged = () => {
      // MetaMask recommends a full reload on chain change
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect]);

  // ── Wrong network warning ────────────────────────────────────
  const isWrongNetwork = state.isConnected && state.chainId !== null && state.chainId !== CHAIN_ID;

  return {
    ...state,
    connect,
    disconnect,
    signTransaction,
    isWrongNetwork,
    isInitializing,
    shortAddress: state.address
      ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}`
      : null,
  };
};
