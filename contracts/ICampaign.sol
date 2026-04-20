// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface ICampaign {
    struct CampaignParams {
        string  title;
        string  slug;
        string  description;
        string  shortDescription;
        string  imageUrl;
        string  category;
        uint256 goalAmount;
        uint256 minContribution;
        uint256 deadline;
        string  tokenSymbol;
        uint256 profitReturnRate;
        uint256 profitReturnDeadline;
    }

    function createCampaign(CampaignParams calldata p) external returns (uint256 campaignId);

    function getCampaign(uint256 campaignId) external view returns (
        address creator,
        uint256 goalAmount,
        uint256 raisedAmount,
        uint256 deadline,
        uint8   status
    );

    function checkStatus(uint256 campaignId) external;
}
