import { useCallback, useState } from 'react';
import { parseEther } from 'ethers';
import { getStartupFund, getFundingVault } from '@/lib/contracts';
import { formatEther } from "ethers";

interface RefundStatus {
  isEligible: boolean;
  hasClaimedRefund: boolean;
  contributionAmount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to manage refund claims for cancelled/flagged campaigns.
 * - Checks if contributor is eligible for refund
 * - Tracks if refund has already been claimed
 * - Handles refund claim transaction
 */
export function useRefund(campaignId: number | null, userAddress: string | null) {
  const [status, setStatus] = useState<RefundStatus>({
    isEligible: false,
    hasClaimedRefund: false,
    contributionAmount: 0,
    loading: false,
    error: null,
  });
  const [claiming, setClaiming] = useState(false);

  // Check refund eligibility status
  const checkRefundStatus = useCallback(async () => {
    if (!campaignId || !userAddress) {
      setStatus(prev => ({
        ...prev,
        isEligible: false,
        contributionAmount: 0,
        error: null,
      }));
      return;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      const fundingVault = getFundingVault();

      // Get contribution amount
      const contribution = await fundingVault.getContribution(campaignId, userAddress);
      const contributionAmount = Number(formatEther(contribution));
      // Check if refund already claimed
      const refundClaimed = await fundingVault.getRefundClaimed(campaignId, userAddress);

      // Eligible if has contribution and hasn't claimed refund yet
      const isEligible = contributionAmount > 0 && !refundClaimed;

      setStatus({
        isEligible,
        hasClaimedRefund: refundClaimed,
        contributionAmount,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check refund status';
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        isEligible: false,
      }));
    }
  }, [campaignId, userAddress]);

  // Claim refund
  const claimRefund = useCallback(async () => {
    if (!campaignId) {
      setStatus(prev => ({
        ...prev,
        error: 'Campaign ID is required',
      }));
      return;
    }

    try {
      setClaiming(true);
      setStatus(prev => ({ ...prev, error: null }));

      const startupFund = await getStartupFund(true); // write mode
      const tx = await startupFund.claimRefund(campaignId);
      await tx.wait();

      // Refresh status after successful claim
      await checkRefundStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim refund';
      setStatus(prev => ({
        ...prev,
        error: errorMessage,
      }));
    } finally {
      setClaiming(false);
    }
  }, [campaignId, checkRefundStatus]);

  return {
    ...status,
    claiming,
    checkRefundStatus,
    claimRefund,
  };
}

/**
 * Export additional helper to get FundingVault contract
 * (Used by useRefund and potentially by frontend)
 */
export function getFundingVaultContract() {
  return getFundingVault();
}
