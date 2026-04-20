export const ROUTE_PATHS = {
  HOME: '/',
  CAMPAIGNS: '/campaigns',
  CAMPAIGN_DETAIL: '/campaigns/:id',
  CREATE_CAMPAIGN: '/create',
<<<<<<< HEAD
  EDIT_CAMPAIGN: '/edit-campaign/:id',
=======
  EDIT_CAMPAIGN: '/campaigns/:id/edit',
>>>>>>> 24283aa9ea662a5013349c1ef8f3f601dc6db98f
  DASHBOARD: '/dashboard',
  ABOUT: '/about',
  FAQ: '/faq',
  NETWORK_STATUS: '/network-status',
  COOKIE_POLICY: '/cookie-policy',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_SERVICE: '/terms-of-service',
  // Short aliases used by existing page files
  TERMS: '/terms-of-service',
  PRIVACY: '/privacy-policy',
  COOKIES: '/cookie-policy',
} as const;

export const CAMPAIGN_STATUS = {
  ACTIVE: 'active',
  FUNDED: 'funded',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  FLAGGED: 'flagged',
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
<<<<<<< HEAD
  profitReturnRate?: number;      // % return promised to investors
  profitReturnDeadline?: string;  // ISO date string (YYYY-MM-DD)
=======
  profitReturnRate: number;
  profitReturnDeadline: string;
>>>>>>> 24283aa9ea662a5013349c1ef8f3f601dc6db98f
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