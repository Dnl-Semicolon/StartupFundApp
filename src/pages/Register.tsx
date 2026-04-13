import React from 'react';
import { motion } from 'framer-motion';
import { UserRegistrationForm } from '@/components/Forms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Zap, 
  Globe, 
  Users, 
  TrendingUp, 
  Lock,
  CheckCircle
} from 'lucide-react';
import { springPresets } from '@/lib/motion';

const features = [
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Blockchain Security",
    description: "Your funds are protected by Ethereum smart contracts with built-in security measures."
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Instant Transactions",
    description: "Fast, transparent transactions with real-time funding progress and automatic settlements."
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Global Access",
    description: "Participate in startup funding from anywhere in the world with just a Web3 wallet."
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Community Driven",
    description: "Join a community of entrepreneurs and investors building the future together."
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Reward Tokens",
    description: "Earn governance tokens and potential profit sharing from successful campaigns."
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Automatic Refunds",
    description: "Smart contracts ensure automatic refunds if campaigns don't reach their goals."
  }
];

const stats = [
  { label: "Total Raised", value: "2,847 ETH", change: "+23%" },
  { label: "Active Campaigns", value: "156", change: "+12%" },
  { label: "Success Rate", value: "78%", change: "+5%" },
  { label: "Community Members", value: "12,450", change: "+34%" }
];

export default function Register() {
  const handleRegistration = (userData: any) => {
    console.log('User registration:', userData);
    // Here you would typically:
    // 1. Save user profile to database
    // 2. Create user account on blockchain
    // 3. Redirect to dashboard
    alert(`Welcome to StartupFund, ${userData.displayName}! Registration successful.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Registration Form */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springPresets.gentle}
              className="order-2 lg:order-1"
            >
              <UserRegistrationForm onSubmit={handleRegistration} />
            </motion.div>

            {/* Right Column - Platform Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springPresets.gentle, delay: 0.1 }}
              className="order-1 lg:order-2 space-y-8"
            >
              <div className="text-center lg:text-left">
                <Badge variant="secondary" className="mb-4">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Trusted by 12,000+ users
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                  Join the Future of
                  <span className="text-primary block">Startup Funding</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Connect your wallet and become part of a decentralized ecosystem where entrepreneurs and investors collaborate to build tomorrow's innovations.
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
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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
              Secured by Ethereum blockchain • Audited smart contracts • GDPR compliant
            </p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="text-xs font-mono">ETH MAINNET</div>
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