import { useState, useCallback, useEffect } from 'react';

/**
 * WalletState interface defining the shape of our blockchain connection data
 */
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string;
  isConnecting: boolean;
  error: string | null;
}

/**
 * useWallet hook provides a simulated Web3 provider interface for the StartupFund platform.
 * In a real production environment, this would integrate with libraries like wagmi, ethers.js, or viem.
 */
export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: '0.00',
    isConnecting: false,
    error: null,
  });

  /**
   * Connects the user's wallet (Simulated)
   */
  const connect = useCallback(async () => {
    if (state.isConnecting) return;

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Simulate network latency for authentic dApp feel
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock wallet data
      const mockAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
      const mockChainId = 1; // Ethereum Mainnet
      const mockBalance = '12.45';

      setState({
        isConnected: true,
        address: mockAddress,
        chainId: mockChainId,
        balance: mockBalance,
        isConnecting: false,
        error: null,
      });

      // Persist session locally
      localStorage.setItem('startupfund_wallet_connected', 'true');
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: 'User rejected connection request',
      }));
    }
  }, [state.isConnecting]);

  /**
   * Disconnects the user's wallet
   */
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

  /**
   * Simulated transaction signing logic for funding campaigns
   */
  const signTransaction = useCallback(async (details: { to: string; amount: number; data?: string }) => {
    if (!state.isConnected) throw new Error('Wallet not connected');
    
    console.log('Signing transaction...', details);
    // Simulate blockchain confirmation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    return {
      hash: `0x${Math.random().toString(16).slice(2, 66)}`,
      status: 'success',
    };
  }, [state.isConnected]);

  /**
   * Auto-connect if a previous session exists
   */
  useEffect(() => {
    const wasConnected = localStorage.getItem('startupfund_wallet_connected') === 'true';
    if (wasConnected && !state.isConnected) {
      connect();
    }
  }, [connect, state.isConnected]);

  /**
   * Listen for simulated account changes
   */
  useEffect(() => {
    // In a real app, we would use window.ethereum.on('accountsChanged', ...)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isConnected) {
        console.log('Simulating wallet disconnection via escape key');
        disconnect();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.isConnected, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    signTransaction,
    // Helper to format short address (e.g., 0x71C7...976F)
    shortAddress: state.address 
      ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}` 
      : null,
  };
};
