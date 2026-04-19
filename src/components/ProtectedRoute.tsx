import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useRegistration } from '@/hooks/useRegistration';
import { ConnectPrompt } from '@/components/ConnectPrompt';
import { Button } from '@/components/ui/button';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected, isInitializing } = useWallet();
  const { isRegistered, isRegistering, isLoading, register } = useRegistration();

  if (isInitializing || isLoading) return null;

  if (!isConnected) {
    return (
      <ConnectPrompt message="Connect your wallet to access this page." />
    );
  }

  if (!isRegistered) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl space-y-6"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Complete Setup</h2>
            <p className="text-muted-foreground text-sm">
              One quick transaction activates your account. Required to create and fund campaigns.
            </p>
          </div>
          <Button
            onClick={() => register(false)}
            disabled={isRegistering}
            size="lg"
            className="w-full gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {isRegistering ? 'Confirm in MetaMask…' : 'Complete Setup'}
          </Button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
