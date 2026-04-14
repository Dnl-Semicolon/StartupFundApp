import { BrowserProvider, JsonRpcProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESSES } from './contractAddresses';

const GANACHE_RPC = 'http://127.0.0.1:7545';

/** Read-only provider — hits Ganache directly, no MetaMask needed */
const getReadProvider = () => new JsonRpcProvider(GANACHE_RPC);

// ─── Minimal ABIs (only the functions the frontend actually calls) ───────────

export const ACCESS_CONTROL_ABI = [
  'function register() external',
  'function isRegistered(address wallet) external view returns (bool)',
  'function isBlocked(address wallet) external view returns (bool)',
  'function paused() external view returns (bool)',
];

export const STARTUPFUND_ABI = [
  // Write
  'function createCampaign(string title, string slug, string description, string shortDescription, string imageUrl, string category, uint256 goalAmount, uint256 minContribution, uint256 deadline, string tokenSymbol) external returns (uint256)',
  'function fundCampaign(uint256 campaignId) external payable',
  'function withdraw(uint256 campaignId) external',
  'function claimRefund(uint256 campaignId) external',
  // Read
  'function totalCampaigns() external view returns (uint256)',
  'function isRegistered(address wallet) external view returns (bool)',
  'function tokenBalanceOf(address wallet) external view returns (uint256)',
];

export const CAMPAIGN_MANAGER_ABI = [
  'function campaignCount() external view returns (uint256)',
  'function getCampaignMeta(uint256 campaignId) external view returns (uint256 id, address creator, string title, string slug, string shortDescription, string imageUrl, string category)',
  'function getCampaignStats(uint256 campaignId) external view returns (uint256 goalAmount, uint256 raisedAmount, uint256 minContribution, uint256 deadline, uint8 status, string tokenSymbol, uint256 backersCount)',
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


// ─── Shared helper: ensure user is registered, register if not ──────────────

export const ensureRegistered = async (address: string): Promise<void> => {
  const ac = getAccessControl(false);
  const registered = await ac.isRegistered(address) as boolean;
  if (!registered) {
    const acWrite = await getAccessControl(true);
    const tx = await acWrite.register();
    await tx.wait();
  }
};
