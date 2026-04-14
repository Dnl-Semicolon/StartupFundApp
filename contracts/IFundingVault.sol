// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IFundingVault {
    function deposit(uint256 campaignId, address contributor) external payable;
    function releaseFunds(uint256 campaignId, address creatorAddress) external;
    function issueRefund(uint256 campaignId, address contributor) external;
    function getContribution(uint256 campaignId, address contributor) external view returns (uint256);
    function getContributors(uint256 campaignId) external view returns (address[] memory);
    function campaignBalance(uint256 campaignId) external view returns (uint256);
    function fundsReleased(uint256 campaignId) external view returns (bool);
}
