import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  Send, 
  Wallet, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  ArrowUpRight, 
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage, 
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { springPresets } from '@/lib/motion';

/**
 * Validation Schema for Campaign Creation
 */
const createCampaignSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(60, "Title too long"),
  category: z.enum(['Tech', 'Fintech', 'Healthcare', 'Green Energy', 'AI', 'Web3']),
  shortDescription: z.string().min(20, "Short description must be at least 20 characters").max(160, "Short description too long"),
  description: z.string().min(100, "Please provide a detailed description (min 100 chars)"),
  goalAmount: z.coerce.number().positive("Goal must be a positive number"),
  minContribution: z.coerce.number().positive("Minimum contribution must be positive"),
  deadline: z.string().refine((val) => new Date(val) > new Date(), {
    message: "Deadline must be in the future",
  }),
  imageUrl: z.string().url("Please provide a valid image URL"),
  tokenSymbol: z.string().min(2, "Min 2 chars").max(6, "Max 6 chars").regex(/^[A-Z]+$/, "Uppercase letters only"),
});

type CreateCampaignValues = z.infer<typeof createCampaignSchema>;

export function CreateCampaignForm({ onSubmit, isSubmitting = false }: { onSubmit: (data: CreateCampaignValues) => void; isSubmitting?: boolean }) {
  const { isConnected, connect, isConnecting } = useWallet();
  const form = useForm<CreateCampaignValues>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      title: '',
      shortDescription: '',
      description: '',
      goalAmount: 1,
      minContribution: 0.01,
      imageUrl: '',
      tokenSymbol: '',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  if (!isConnected) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            You need to connect your Web3 wallet to create a new startup funding campaign on the blockchain.
          </p>
          <Button onClick={connect} disabled={isConnecting} className="bg-primary hover:shadow-lg transition-all">
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springPresets.gentle}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Startup Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Nexus AI Solutions" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Tech', 'Fintech', 'Healthcare', 'Green Energy', 'AI', 'Web3'].map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="goalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Goal (ETH)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minContribution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min. Entry (ETH)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tokenSymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Symbol</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. EFLOW"
                          maxLength={6}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Deadline</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="date" {...field} />
                        <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://unsplash.com/..." {...field} />
                    </FormControl>
                    <FormDescription>High resolution startup pitch image</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Elevator Pitch</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Briefly describe your startup's core value proposition..." 
                        className="h-20 resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Business Plan</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detail your roadmap, team, and how the funds will be used..." 
                        className="h-44" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="pt-6 border-t">
            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto px-12 gap-2">
              <Plus className="h-5 w-5" /> {isSubmitting ? 'Submitting to blockchain...' : 'Launch Campaign'}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}

/**
 * Form for Funding a Campaign
 */
export function FundCampaignForm({ campaignId, onSubmit }: { campaignId: string, onSubmit: (amount: number) => void }) {
  const { isConnected, connect, balance } = useWallet();
  const [amount, setAmount] = React.useState<string>('0.1');

  const handleFund = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      onSubmit(numAmount);
    }
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Back this project
        </CardTitle>
        <CardDescription>
          Contribute to the future of innovation and earn reward tokens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Button onClick={connect} variant="outline" className="w-full">
            Connect Wallet to Fund
          </Button>
        ) : (
          <form onSubmit={handleFund} className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-medium">Contribution Amount (ETH)</label>
                <span className="text-muted-foreground">Balance: {balance} ETH</span>
              </div>
              <div className="relative">
                <Input 
                  type="number" 
                  step="0.01" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-12 text-lg font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-semibold text-sm opacity-50">ETH</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['0.1', '0.5', '1.0'].map((val) => (
                <Button 
                  key={val} 
                  type="button" 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setAmount(val)}
                  className="text-xs"
                >
                  {val} ETH
                </Button>
              ))}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-md font-semibold gap-2"
              disabled={parseFloat(amount) > parseFloat(balance)}
            >
              {parseFloat(amount) > parseFloat(balance) ? "Insufficient Balance" : "Confirm Investment"}
              <ArrowUpRight className="h-4 w-4" />
            </Button>

            <p className="text-[10px] text-center text-muted-foreground px-4">
              By clicking confirm, you agree to the platform's smart contract terms and understand that crypto investments carry risk.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Form for Withdrawing Funds (Creator Only)
 */
export function WithdrawForm({ campaignId, onSubmit }: { campaignId: string, onSubmit: () => void }) {
  const { isConnected, connect } = useWallet();

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Withdraw Funds
        </CardTitle>
        <CardDescription>
          Access the capital raised for your startup milestones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive" className="bg-destructive/10 border-none">
          <Info className="h-4 w-4" />
          <AlertTitle>Important Security Note</AlertTitle>
          <AlertDescription className="text-xs">
            Funds will be transferred to your connected wallet address. This action is recorded on the blockchain and cannot be reversed.
          </AlertDescription>
        </Alert>

        {!isConnected ? (
          <Button onClick={connect} variant="outline" className="w-full">
            Connect Wallet
          </Button>
        ) : (
          <Button 
            onClick={onSubmit} 
            variant="destructive" 
            className="w-full font-semibold"
          >
            Process Withdrawal Request
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * User Registration Form with Wallet Connection
 */
export function UserRegistrationForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const { isConnected, connect, address, isConnecting } = useWallet();
  const [profile, setProfile] = React.useState({
    displayName: '',
    email: '',
    bio: '',
    userType: 'investor' as 'investor' | 'entrepreneur'
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConnected && profile.displayName) {
      onSubmit({ ...profile, walletAddress: address });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Join StartupFund</CardTitle>
        <CardDescription>
          Connect your wallet and create your investor/entrepreneur profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="text-center space-y-4">
            <Wallet className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="font-semibold mb-2">Connect Your Web3 Wallet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We support MetaMask, WalletConnect, and other Web3 wallets
              </p>
              <Button onClick={connect} disabled={isConnecting} className="w-full">
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <Alert className="bg-primary/10 border-primary/20">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Display Name</label>
                <Input 
                  placeholder="Your name or company"
                  value={profile.displayName}
                  onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email (Optional)</label>
                <Input 
                  type="email"
                  placeholder="your@email.com"
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium">I am a...</label>
                <Select 
                  value={profile.userType} 
                  onValueChange={(value: 'investor' | 'entrepreneur') => 
                    setProfile({...profile, userType: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investor">Investor/Contributor</SelectItem>
                    <SelectItem value="entrepreneur">Entrepreneur/Founder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Bio (Optional)</label>
                <Textarea 
                  placeholder="Tell us about yourself..."
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  className="h-20 resize-none"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!profile.displayName}>
              Complete Registration
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Refund Request Form for Failed Campaigns
 */
export function RefundRequestForm({ campaignId, contributionAmount, onSubmit }: { 
  campaignId: string, 
  contributionAmount: number, 
  onSubmit: () => void 
}) {
  const { isConnected, connect } = useWallet();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleRefund = async () => {
    setIsProcessing(true);
    try {
      await onSubmit();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
          <AlertCircle className="h-5 w-5" />
          Campaign Refund Available
        </CardTitle>
        <CardDescription>
          This campaign did not reach its funding goal. You can claim your refund.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Your Contribution:</span>
            <span className="font-mono font-bold">{contributionAmount} ETH</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium">Refund Amount:</span>
            <span className="font-mono font-bold text-green-600">{contributionAmount} ETH</span>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Refunds are processed automatically by the smart contract. Gas fees may apply.
          </AlertDescription>
        </Alert>

        {!isConnected ? (
          <Button onClick={connect} variant="outline" className="w-full">
            Connect Wallet to Claim Refund
          </Button>
        ) : (
          <Button 
            onClick={handleRefund} 
            disabled={isProcessing}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {isProcessing ? "Processing Refund..." : "Claim Refund"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Reward Token Display and Claim Form
 */
export function RewardTokenForm({ campaignId, tokenAmount, tokenSymbol, onClaim }: {
  campaignId: string,
  tokenAmount: number,
  tokenSymbol: string,
  onClaim: () => void
}) {
  const { isConnected, connect } = useWallet();
  const [isClaiming, setIsClaiming] = React.useState(false);

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await onClaim();
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
          <Plus className="h-5 w-5" />
          Reward Tokens Available
        </CardTitle>
        <CardDescription>
          Campaign successful! Claim your reward tokens representing your stake.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
          <div className="text-center">
            <div className="text-3xl font-bold font-mono text-green-600 mb-2">
              {tokenAmount} {tokenSymbol}
            </div>
            <p className="text-sm text-muted-foreground">
              ERC-20 tokens representing your contribution
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <p>• Tokens are minted 1:1 with your ETH contribution</p>
          <p>• Tokens may represent voting rights or profit sharing</p>
          <p>• Tokens are transferable and tradeable</p>
        </div>

        {!isConnected ? (
          <Button onClick={connect} variant="outline" className="w-full">
            Connect Wallet to Claim Tokens
          </Button>
        ) : (
          <Button 
            onClick={handleClaim} 
            disabled={isClaiming}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isClaiming ? "Minting Tokens..." : "Claim Reward Tokens"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
