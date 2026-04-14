import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserRegistrationForm } from '@/components/Forms';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROUTE_PATHS } from '@/lib/index';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Shield,
  Zap,
  Globe,
  Users,
  TrendingUp,
  Lock,
  CheckCircle,
  CheckCircle2,
  Rocket,
  ArrowRight,
} from 'lucide-react';
import { springPresets } from '@/lib/motion';

const features = [
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Blockchain Security',
    description: 'Your contributions are protected by Ethereum smart contracts with built-in security measures.',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Instant Transactions',
    description: 'Fast, transparent transactions with real-time funding progress and automatic settlements.',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Global Access',
    description: 'Participate in startup funding from anywhere in the world with just a Web3 wallet.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Community Driven',
    description: 'Join a community of entrepreneurs and contributors building the future together.',
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'Reward Tokens',
    description: 'Earn ERC-20 reward tokens proportional to your contribution on every successful campaign.',
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: 'Automatic Refunds',
    description: 'Smart contracts ensure automatic refunds if campaigns do not reach their goals by deadline.',
  },
];

const stats = [
  { label: 'Total Raised', value: '2,847 ETH', change: '+23%' },
  { label: 'Active Campaigns', value: '156', change: '+12%' },
  { label: 'Success Rate', value: '78%', change: '+5%' },
  { label: 'Community Members', value: '12,450', change: '+34%' },
];

export default function Register() {
  const navigate  = useNavigate();
  const { register } = useUserRole();
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  const handleRegistration = (userData: { displayName: string; email: string; bio: string; walletAddress: string | null }) => {
    register(userData.displayName);
    setRegisteredName(userData.displayName);
    setShowSuccess(true);
    setTimeout(() => navigate(ROUTE_PATHS.DASHBOARD), 3000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="relative w-24 h-24 mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
            />
            <CheckCircle2 className="w-24 h-24 text-primary relative z-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {registeredName}!</h1>
            <p className="text-muted-foreground">
              Your account is ready. You are registered as a <span className="font-semibold text-foreground">Contributor</span> — you can browse and fund campaigns right away.
            </p>
            <p className="text-sm text-muted-foreground">
              Want to raise funds instead?{' '}
              <Link to={ROUTE_PATHS.ENTREPRENEUR} className="text-primary underline underline-offset-4 hover:no-underline">
                Become an Entrepreneur
              </Link>
            </p>
          </div>
          <Button onClick={() => navigate(ROUTE_PATHS.DASHBOARD)} className="w-full h-12 text-lg">
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — Registration Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springPresets.gentle}
              className="order-2 lg:order-1"
            >
              <UserRegistrationForm onSubmit={handleRegistration} />
            </motion.div>

            {/* Right — Platform Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springPresets.gentle, delay: 0.1 }}
              className="order-1 lg:order-2 space-y-8"
            >
              <div className="text-center lg:text-left">
                <Badge variant="secondary" className="mb-4">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Trusted by 12,000+ members
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                  Join the Future of
                  <span className="text-primary block">Startup Funding</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Connect your wallet and join a decentralised ecosystem where entrepreneurs and contributors collaborate to build tomorrow's innovations.
                </p>
              </div>

              {/* Platform Stats */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springPresets.gentle, delay: 0.2 + index * 0.1 }}
                  >
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold font-mono">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {stat.change}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springPresets.gentle, delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why Choose StartupFund?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the next generation of crowdfunding with blockchain technology,
              smart contracts, and a community-driven approach to innovation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springPresets.gentle, delay: 0.4 + index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Entrepreneur CTA Banner */}
      <div className="py-10 bg-primary/5 border-t border-primary/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springPresets.gentle, delay: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-base">Are you an entrepreneur?</p>
                <p className="text-sm text-muted-foreground">
                  Register first, then upgrade your account to start raising ETH funding on-chain.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0 gap-2">
              <Link to={ROUTE_PATHS.ENTREPRENEUR}>
                Learn More
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="py-12 border-t">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...springPresets.gentle, delay: 0.6 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground mb-6">
              Secured by Ethereum blockchain • Smart contract enforced • Ganache local network
            </p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="text-xs font-mono">GANACHE LOCAL</div>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="text-xs font-mono">SMART CONTRACTS</div>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="text-xs font-mono">DECENTRALIZED</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
