import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTE_PATHS } from '@/lib/index';

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="space-y-1">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
            Error
          </p>
          <h1 className="text-8xl font-black tracking-tighter font-mono text-primary/20 select-none">
            404
          </h1>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Block Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The page you're looking for doesn't exist on this chain.
            </p>
          </div>
          <div className="bg-muted/60 rounded-lg px-4 py-2">
            <p className="text-xs font-mono text-muted-foreground truncate">
              PATH: {location.pathname}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to={ROUTE_PATHS.HOME} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={ROUTE_PATHS.CAMPAIGNS}>Browse Campaigns</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
