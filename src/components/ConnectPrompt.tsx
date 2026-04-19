import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';

interface ConnectPromptProps {
  message?: string;
  compact?: boolean;
}

export function ConnectPrompt({
  message = 'Connect your wallet to interact with this campaign.',
  compact = false,
}: ConnectPromptProps) {
  const { connect, isConnecting } = useWallet();

  if (compact) {
    return (
      <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm text-center space-y-3">
        <p className="font-medium">Want to back this project?</p>
        <p className="text-muted-foreground text-xs">{message}</p>
        <Button onClick={connect} disabled={isConnecting} className="w-full gap-2" size="sm">
          <Wallet className="w-4 h-4" />
          {isConnecting ? 'Connecting…' : 'Connect Wallet'}
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Wallet Required</h2>
        <p className="text-muted-foreground mb-8">{message}</p>
        <Button onClick={connect} disabled={isConnecting} size="lg" className="w-full gap-2">
          <Wallet className="w-4 h-4" />
          {isConnecting ? 'Connecting…' : 'Connect Wallet'}
        </Button>
      </div>
    </motion.div>
  );
}
