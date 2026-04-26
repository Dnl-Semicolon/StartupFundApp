export const ROUTE_PATHS = {
  HOME:             '/',
  CAMPAIGNS:        '/campaigns',
  CAMPAIGN_DETAIL:  '/campaigns/:id',
  CREATE_CAMPAIGN:  '/create',
  EDIT_CAMPAIGN:    '/campaigns/:id/edit',
  DASHBOARD:        '/dashboard',
  ABOUT:            '/about',
  FAQ:              '/faq',
  NETWORK_STATUS:   '/network',
  COOKIE_POLICY:    '/cookies',
  PRIVACY_POLICY:   '/privacy',
  TERMS_OF_SERVICE: '/terms',
  // Aliases — used by teammate-authored pages internally:
  COOKIES:          '/cookies',
  PRIVACY:          '/privacy',
  TERMS:            '/terms',
} as const;

export const CAMPAIGN_STATUS = {
  ACTIVE: 'active',
  FUNDED: 'funded',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  FLAGGED: 'flagged',
  PENDING: 'pending',
  REJECTED: 'rejected',
} as const;

export type CampaignStatus = typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS];

export interface User {
  id: string;
  walletAddress: string;
  name: string;
  avatar?: string;
  bio?: string;
  role: 'entrepreneur' | 'investor' | 'admin';
  joinedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  isReached: boolean;
}

export interface Campaign {
  id: string;
  creatorId: string;
  creator: User;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  goalAmount: number;
  raisedAmount: number;
  imageUrl: string;
  category: 'Tech' | 'Fintech' | 'Healthcare' | 'Green Energy' | 'AI' | 'Web3';
  status: CampaignStatus;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  backersCount: number;
  milestones: Milestone[];
  tokenRewardSymbol?: string;
  minContribution: number;
  tags?: string[];
  profitReturnRate?: number;       // 0..100 (%). Stored in description JSON tail.
  profitReturnDeadline?: string;   // ISO date. Stored in description JSON tail.
  /** Optional seeded contributor list for mock campaigns (off-chain). */
  contributors?: Array<{ address: string; amount: number }>;
}

export interface Contribution {
  id: string;
  campaignId: string;
  campaignTitle?: string;
  contributorId: string;
  amount: number;
  currency: string;
  timestamp: string;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
  chainId: number | null;
}

export interface DashboardStats {
  totalInvested: number;
  activeCampaigns: number;
  rewardTokensEarned: number;
  transactionCount: number;
}