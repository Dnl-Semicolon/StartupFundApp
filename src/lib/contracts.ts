import { BrowserProvider, JsonRpcProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESSES } from './contractAddresses';

// In dev, requests go through Vite's proxy (/ganache-rpc → http://127.0.0.1:7545)
// to avoid CORS errors. In production, point directly at your RPC node.
const GANACHE_RPC =
  import.meta.env.DEV
    ? `${window.location.origin}/ganache-rpc`
    : 'http://127.0.0.1:7545';

/** Read-only provider — hits Ganache via Vite proxy, no MetaMask needed */
const getReadProvider = () => new JsonRpcProvider(GANACHE_RPC);

// ─── Minimal ABIs (only the functions the frontend actually calls) ───────────

export const ACCESS_CONTROL_ABI = [
  'function register() external',
  'function isRegistered(address wallet) external view returns (bool)',
  'function isEntrepreneur(address wallet) external view returns (bool)',
  'function isBlocked(address wallet) external view returns (bool)',
  'function paused() external view returns (bool)',
];

export const STARTUPFUND_ABI = [
  // Write
  'function createCampaign((string title, string slug, string description, string shortDescription, string imageUrl, string category, uint256 goalAmount, uint256 minContribution, uint256 deadline, string tokenSymbol, uint256 profitReturnRate, uint256 profitReturnDeadline) p) external returns (uint256)',
  'function updateCampaign(uint256 campaignId, string title, string description, string shortDescription, string imageUrl) external',
  'function fundCampaign(uint256 campaignId) external payable',
  'function withdraw(uint256 campaignId) external',
  'function claimRefund(uint256 campaignId) external',
  // Write
  'function flagCampaign(uint256 campaignId) external',
  'function unflagCampaign(uint256 campaignId) external',
  // Read
  'function totalCampaigns() external view returns (uint256)',
  'function isRegistered(address wallet) external view returns (bool)',
  'function tokenBalanceOf(address wallet) external view returns (uint256)',
  'function flagCount(uint256 campaignId) external view returns (uint256)',
  'function hasFlagged(uint256 campaignId, address wallet) external view returns (bool)',
  // Events (needed for queryFilter)
  'event FundingReceived(uint256 indexed campaignId, address indexed contributor, uint256 amount)',
  'event RefundClaimed(uint256 indexed campaignId, address indexed contributor, uint256 amount)',
  'event TokensMinted(uint256 indexed campaignId, address indexed contributor, uint256 tokens)',
  'event CampaignFlagged(uint256 indexed campaignId, address indexed flagger, uint256 totalFlags)',
];

export const CAMPAIGN_MANAGER_ABI = [
  'function campaignCount() external view returns (uint256)',
  'function getCampaignMeta(uint256 campaignId) external view returns (uint256 id, address creator, string title, string slug, string shortDescription, string imageUrl, string category)',
  'function getCampaignStats(uint256 campaignId) external view returns (uint256 goalAmount, uint256 raisedAmount, uint256 minContribution, uint256 deadline, uint8 status, string tokenSymbol, uint256 backersCount, uint256 profitReturnRate, uint256 profitReturnDeadline)',
  'function getCampaignDescription(uint256 campaignId) external view returns (string)',
  'function getStatus(uint256 campaignId) external view returns (uint8)',
];

export const REWARD_TOKEN_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
];

// ─── Contract instance helpers ───────────────────────────────────────────────

const getMetaMaskProvider = () => {
  if (!window.ethereum) throw new Error('MetaMask not found');
  return new BrowserProvider(window.ethereum);
};

/** Read-only contract — uses JsonRpcProvider, no MetaMask connection required */
export const getReadContract = (address: string, abi: string[]) => {
  return new Contract(address, abi, getReadProvider());
};

/** Write contract — prompts MetaMask to sign */
export const getWriteContract = async (address: string, abi: string[]) => {
  const provider = getMetaMaskProvider();
  const signer = await provider.getSigner();
  return new Contract(address, abi, signer);
};

// ─── Named shortcuts ─────────────────────────────────────────────────────────

export const getAccessControl = (write = false) =>
  write
    ? getWriteContract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI)
    : getReadContract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI);

export const getStartupFund = (write = false) =>
  write
    ? getWriteContract(CONTRACT_ADDRESSES.startupFund, STARTUPFUND_ABI)
    : getReadContract(CONTRACT_ADDRESSES.startupFund, STARTUPFUND_ABI);

export const getCampaignManager = () =>
  getReadContract(CONTRACT_ADDRESSES.campaignManager, CAMPAIGN_MANAGER_ABI);

export const getRewardToken = () =>
  getReadContract(CONTRACT_ADDRESSES.rewardToken, REWARD_TOKEN_ABI);


// ─── Shared helper: verify registration before contract calls ─────────────────

export const ensureRegistered = async (address: string): Promise<void> => {
  const cached = localStorage.getItem(`sf_registered_${address.toLowerCase()}`);
  if (cached === 'true') return;
  const ac = getReadContract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI);
  const registered = await ac.isRegistered(address) as boolean;
  if (!registered) {
    throw new Error('Account setup incomplete. Please complete setup and try again.');
  }
  localStorage.setItem(`sf_registered_${address.toLowerCase()}`, 'true');
};
