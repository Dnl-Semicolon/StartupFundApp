export const ROUTE_PATHS = {
  HOME: '/',
  CAMPAIGNS: '/campaigns',
  CAMPAIGN_DETAIL: '/campaigns/:id',
  CREATE_CAMPAIGN: '/create',
  DASHBOARD: '/dashboard',
  ABOUT: '/about',
  REGISTER: '/register',
  ENTREPRENEUR: '/become-entrepreneur',
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