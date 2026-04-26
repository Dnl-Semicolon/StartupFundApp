import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { JsonRpcProvider } from 'ethers';
import { CONTRACT_ADDRESSES, CHAIN_ID } from '@/lib/contractAddresses';
import { ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';

type Status = 'checking' | 'online' | 'degraded' | 'offline';

interface ContractCheck {
  name: string;
  address: string;
  label: string;
  status: 'checking' | 'ok' | 'error';
  codeSize?: number;
}

interface NetworkState {
  status: Status;
  blockNumber: number | null;
  chainId: number | null;
  peerCount: string | null;
  lastChecked: Date | null;
  contracts: ContractCheck[];
}

const GANACHE_RPC = import.meta.env.DEV
  ? `${window.location.origin}/ganache-rpc`
  : 'http://127.0.0.1:7545';

const initialContracts: ContractCheck[] = [
  { name: 'StartupFund',     address: CONTRACT_ADDRESSES.startupFund,     label: 'Core orchestration', status: 'checking' },
  { name: 'CampaignManager', address: CONTRACT_ADDRESSES.campaignManager, label: 'Campaign storage',   status: 'checking' },
  { name: 'FundingVault',    address: CONTRACT_ADDRESSES.fundingVault,    label: 'ETH custody',        status: 'checking' },
  { name: 'RewardToken',     address: CONTRACT_ADDRESSES.rewardToken,     label: 'ERC-20 token',       status: 'checking' },
  { name: 'AccessControl',   address: CONTRACT_ADDRESSES.accessControl,   label: 'Registration',       status: 'checking' },
];

function StatusDot({ status }: { status: Status | 'ok' | 'error' | 'checking' }) {
  if (status === 'online' || status === 'ok') {
    return <CheckCircle2 className="w-4 h-4 text-chart-2 flex-shrink-0" />;
  }
  if (status === 'offline' || status === 'error') {
    return <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />;
  }
  if (status === 'degraded') {
    return <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
  }
  return (
    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground border-t-primary animate-spin flex-shrink-0" />
  );
}

function statusLabel(s: Status): string {
  if (s === 'online') return 'Operational';
  if (s === 'degraded') return 'Degraded';
  if (s === 'offline') return 'Offline';
  return 'Checking…';
}

function statusColor(s: Status): string {
  if (s === 'online') return 'text-chart-2';
  if (s === 'degraded') return 'text-yellow-500';
  if (s === 'offline') return 'text-destructive';
  return 'text-muted-foreground';
}

export default function NetworkStatus() {
  const [state, setState] = useState<NetworkState>({
    status: 'checking',
    blockNumber: null,
    chainId: null,
    peerCount: null,
    lastChecked: null,
    contracts: initialContracts,
  });

  const check = async () => {
    setState(prev => ({
      ...prev,
      status: 'checking',
      contracts: prev.contracts.map(c => ({ ...c, status: 'checking' })),
    }));

    try {
      const provider = new JsonRpcProvider(GANACHE_RPC);

      const [blockNumber, network] = await Promise.all([
        provider.getBlockNumber(),
        provider.getNetwork(),
      ]);

      const chainId = Number(network.chainId);

      // Check each contract has deployed code
      const contractResults = await Promise.all(
        initialContracts.map(async c => {
          try {
            const code = await provider.getCode(c.address);
            const ok = code && code !== '0x' && code.length > 2;
            return { ...c, status: ok ? ('ok' as const) : ('error' as const), codeSize: (code.length - 2) / 2 };
          } catch {
            return { ...c, status: 'error' as const };
          }
        }),
      );

      const allOk = contractResults.every(c => c.status === 'ok');
      const someOk = contractResults.some(c => c.status === 'ok');
      const networkOk = chainId === CHAIN_ID;

      const overallStatus: Status =
        allOk && networkOk ? 'online' : someOk ? 'degraded' : 'offline';

      setState({
        status: overallStatus,
        blockNumber,
        chainId,
        peerCount: null,
        lastChecked: new Date(),
        contracts: contractResults,
      });
    } catch {
      setState(prev => ({
        ...prev,
        status: 'offline',
        blockNumber: null,
        chainId: null,
        lastChecked: new Date(),
        contracts: prev.contracts.map(c => ({ ...c, status: 'error' })),
      }));
    }
  };

  useEffect(() => { check(); }, []);

  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-20 px-4 border-b border-border">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Activity className="w-4 h-4" />
              Live
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Network Status</h1>
            <p className="text-muted-foreground">
              Real-time status of the blockchain RPC and deployed smart contracts.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl space-y-8">

          {/* Overall status card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border border-border rounded-2xl p-6 bg-card"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <StatusDot status={state.status} />
                <div>
                  <p className="font-semibold">Overall Platform Status</p>
                  <p className={`text-sm ${statusColor(state.status)}`}>{statusLabel(state.status)}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={check} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-muted/40 rounded-xl p-4">
                <p className="text-muted-foreground text-xs mb-1">Block Number</p>
                <p className="font-bold font-mono text-lg">
                  {state.blockNumber !== null ? `#${state.blockNumber.toLocaleString()}` : '—'}
                </p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4">
                <p className="text-muted-foreground text-xs mb-1">Chain ID</p>
                <p className={`font-bold font-mono text-lg ${state.chainId !== null && state.chainId !== CHAIN_ID ? 'text-destructive' : ''}`}>
                  {state.chainId !== null ? state.chainId : '—'}
                  {state.chainId !== null && state.chainId !== CHAIN_ID && (
                    <span className="text-xs text-destructive font-normal ml-2">(expected {CHAIN_ID})</span>
                  )}
                </p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 col-span-2 md:col-span-1">
                <p className="text-muted-foreground text-xs mb-1">RPC Endpoint</p>
                <p className="font-mono text-xs text-foreground/80 break-all">
                  {GANACHE_RPC}
                </p>
              </div>
            </div>

            {state.lastChecked && (
              <p className="text-xs text-muted-foreground mt-4">
                Last checked at {fmt(state.lastChecked)}
              </p>
            )}
          </motion.div>

          {/* Contract statuses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h2 className="text-lg font-bold mb-4">Smart Contracts</h2>
            <div className="space-y-3">
              {state.contracts.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="flex items-center justify-between border border-border rounded-xl px-5 py-4 bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusDot status={c.status} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className="text-xs text-muted-foreground hidden sm:inline">— {c.label}</span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground truncate">{c.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {c.status === 'ok' && c.codeSize !== undefined && (
                      <span className="text-xs text-muted-foreground hidden md:inline">{c.codeSize} bytes</span>
                    )}
                    <span className={`text-xs font-medium ${c.status === 'ok' ? 'text-chart-2' : c.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {c.status === 'ok' ? 'Deployed' : c.status === 'error' ? 'Not found' : 'Checking'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Setup hint when offline */}
          {state.status === 'offline' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-destructive/30 bg-destructive/10 rounded-xl p-5 text-sm"
            >
              <p className="font-semibold text-destructive mb-2">The chain is not reachable</p>
              <p className="text-muted-foreground">
                Make sure your development chain is running at <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">http://127.0.0.1:7545</code> and that the contracts have been deployed. See the{' '}
                <Link to={ROUTE_PATHS.FAQ} className="text-primary hover:underline">FAQ</Link> for setup instructions.
              </p>
            </motion.div>
          )}

          {/* Chain ID mismatch hint */}
          {state.chainId !== null && state.chainId !== CHAIN_ID && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-yellow-500/30 bg-yellow-500/10 rounded-xl p-5 text-sm"
            >
              <p className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Chain ID mismatch</p>
              <p className="text-muted-foreground">
                The RPC endpoint returned Chain ID <strong>{state.chainId}</strong>, but StartupFund expects <strong>{CHAIN_ID}</strong>. In MetaMask, set the custom network RPC to <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">http://127.0.0.1:7545</code> with Chain ID <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{CHAIN_ID}</code>.
              </p>
            </motion.div>
          )}

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-muted/30 border border-border rounded-xl p-5 text-sm text-muted-foreground"
          >
            <p className="font-semibold text-foreground mb-2">About this check</p>
            <p>
              Status is determined by connecting to the chain RPC endpoint and calling <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">eth_getCode</code> for each contract address. A contract with no deployed bytecode ("0x") is shown as <em>Not found</em>.
            </p>
            <p className="mt-2">
              This check runs entirely in your browser — no data is sent to any external server.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer links */}
      <section className="py-12 px-4 border-t border-border bg-muted/20">
        <div className="container mx-auto max-w-3xl text-center text-sm text-muted-foreground">
          <div className="flex flex-wrap justify-center gap-6">
            <Link to={ROUTE_PATHS.FAQ} className="hover:text-primary transition-colors">FAQ</Link>
            <Link to={ROUTE_PATHS.TERMS} className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to={ROUTE_PATHS.PRIVACY} className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to={ROUTE_PATHS.COOKIES} className="hover:text-primary transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
