// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IVerification {
    function register() external;
    function isRegistered(address wallet) external view returns (bool);
    function isEntrepreneur(address wallet) external view returns (bool);
    function isBlocked(address wallet) external view returns (bool);
}
