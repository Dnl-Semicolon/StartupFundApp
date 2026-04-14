// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface ICampaign {
    function createCampaign(
        string memory title,
        string memory slug,
        string memory description,
        string memory shortDescription,
        string memory imageUrl,
        string memory category,
        uint256 goalAmount,
        uint256 minContribution,
        uint256 deadline,
        string memory tokenSymbol
    ) external returns (uint256 campaignId);

    function getCampaign(uint256 campaignId) external view returns (
        address creator,
        uint256 goalAmount,
        uint256 raisedAmount,
        uint256 deadline,
        uint8 status
    );

    function checkStatus(uint256 campaignId) external;
}
