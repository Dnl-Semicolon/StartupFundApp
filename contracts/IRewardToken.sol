// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IRewardToken {
    function mint(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}
