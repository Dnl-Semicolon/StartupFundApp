import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Menu,
  Wallet,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Rocket,
  Info,
  ShieldCheck
} from 'lucide-react';
import { SiX, SiLinkedin, SiGithub } from 'react-icons/si';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTE_PATHS } from '@/lib';
import { useWallet } from '@/hooks/useWallet';
import { useRegistration } from '@/hooks/useRegistration';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isConnected, address, shortAddress, balance, isConnecting, connect, disconnect, isWrongNetwork, isInitializing } = useWallet();
  const { isRegistered, register, isLoading: isRegLoading } = useRegistration();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Auto-register new wallets silently on first connect.
  // Waiting on isRegLoading closes the race window where useRegistration
  // hasn't finished its async chain check yet — without it, this effect
  // fires immediately with the default isRegistered=false and pops MetaMask
  // for wallets that are already registered, producing a noisy revert toast.
  useEffect(() => {
    console.debug('[sf:layout] autoreg eval', {
      isInitializing, isRegLoading, isConnected, hasAddress: !!address, isRegistered,
    });
    if (!isInitializing && !isRegLoading && isConnected && address && !isRegistered) {
      console.debug('[sf:layout] firing auto-register');
      register(true);
    }
  }, [isConnected, address, isRegistered, isInitializing, isRegLoading, register]);

  const navLinks = [
    { name: 'Discover', path: ROUTE_PATHS.CAMPAIGNS,       icon: Rocket,     show: true },
    { name: 'Create',   path: ROUTE_PATHS.CREATE_CAMPAIGN, icon: PlusCircle, show: isConnected },
    { name: 'About',    path: ROUTE_PATHS.ABOUT,           icon: Info,       show: true },
  ].filter(l => l.show);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header
        ref={headerRef}
        className={`fixed top-0 w-full z-50 transition-all duration-300 h-16 border-b ${
          isScrolled ? 'bg-background/80 backdrop-blur-md border-border/80 shadow-sm' : 'bg-transparent border-transparent'
        }`}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to={ROUTE_PATHS.HOME} className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                S
              </div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                StartupFund
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <Link to={ROUTE_PATHS.DASHBOARD} className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-full border-primary/20 bg-primary/5 hover:bg-primary/10">
                      <div className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
                      <span className="font-mono text-xs">{shortAddress}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Connected Wallet</p>
                        <p className="text-xs leading-none text-muted-foreground font-mono mt-1">
                          {address}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Balance</span>
                        <span className="font-bold">{balance} ETH</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={ROUTE_PATHS.DASHBOARD} className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={disconnect} className="text-destructive focus:text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Disconnect</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button
                onClick={connect}
                disabled={isConnecting}
                className="gap-2 shadow-lg shadow-primary/20"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? 'Connecting…' : 'Connect Wallet'}
              </Button>
            )}

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left">Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-foreground/80'}`
                      }
                    >
                      <link.icon className="w-5 h-5" />
                      {link.name}
                    </NavLink>
                  ))}
                  {isConnected && (
                    <NavLink
                      to={ROUTE_PATHS.DASHBOARD}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-foreground/80'}`
                      }
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </NavLink>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <AnimatePresence>
          {isWrongNetwork && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full bg-destructive/95 text-destructive-foreground text-center text-sm py-2.5 px-4 font-medium backdrop-blur-sm"
            >
              Wrong network detected — please switch MetaMask to{' '}
              <span className="font-bold">Ganache (Chain ID: 1337)</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-muted/30 border-t border-border mt-24">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <Link to={ROUTE_PATHS.HOME} className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                  S
                </div>
                <span className="text-xl font-bold tracking-tight">StartupFund</span>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Empowering the next generation of entrepreneurs through decentralized crowdfunding and blockchain transparency.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="p-2 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition-all">
                  <SiX className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition-all">
                  <SiLinkedin className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition-all">
                  <SiGithub className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6">Platform</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link to={ROUTE_PATHS.CAMPAIGNS} className="hover:text-primary transition-colors">Browse Projects</Link></li>
                <li><Link to={ROUTE_PATHS.CREATE_CAMPAIGN} className="hover:text-primary transition-colors">Launch a Campaign</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">Success Stories</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Resources</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link to={ROUTE_PATHS.ABOUT} className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">Whitepaper</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Security</h4>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <ShieldCheck className="w-5 h-5 text-chart-2" />
                  <span className="text-sm font-semibold">Audit Verified</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Our smart contracts are audited for maximum security of your funds and reward tokens.
                </p>
                <Badge variant="secondary" className="mt-4 w-full justify-center py-1 text-[10px] font-mono">
                  CONTRACT: 0x89...342F
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2026 StartupFund Protocol. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link to={ROUTE_PATHS.FAQ}              className="hover:text-primary transition-colors">FAQ</Link>
              <Link to={ROUTE_PATHS.NETWORK_STATUS}   className="hover:text-primary transition-colors">Network Status</Link>
              <Link to={ROUTE_PATHS.TERMS_OF_SERVICE} className="hover:text-primary transition-colors">Terms</Link>
              <Link to={ROUTE_PATHS.PRIVACY_POLICY}   className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to={ROUTE_PATHS.COOKIE_POLICY}    className="hover:text-primary transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
