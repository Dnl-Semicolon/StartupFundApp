// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./IVerification.sol";

/**
 * @title AccessControl
 * @dev Manages user registration, wallet blocking, and platform pause.
 *      Every registered wallet is automatically both contributor and entrepreneur.
 */
contract AccessControl is IVerification {
    address public owner;
    bool public paused;

    mapping(address => bool) public blockedWallets;
    mapping(address => bool) public registeredUsers;

    event Paused(address indexed admin);
    event Unpaused(address indexed admin);
    event WalletBlocked(address indexed wallet);
    event WalletUnblocked(address indexed wallet);
    event UserRegistered(address indexed wallet);

    modifier onlyOwner() {
        require(msg.sender == owner, "AccessControl: not owner");
        _;
    }

    modifier notBlocked() {
        require(!blockedWallets[msg.sender], "AccessControl: wallet blocked");
        _;
    }

    modifier notPaused() {
        require(!paused, "AccessControl: platform paused");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ── User self-registration ────────────────────────────────────────────────

    function register() external override notBlocked notPaused {
        require(!registeredUsers[msg.sender], "AccessControl: already registered");
        registeredUsers[msg.sender] = true;
        emit UserRegistered(msg.sender);
    }

    function isRegistered(address wallet) external view override returns (bool) {
        return registeredUsers[wallet];
    }

    // Every registered wallet is automatically an entrepreneur — no separate step
    function isEntrepreneur(address wallet) external view override returns (bool) {
        return registeredUsers[wallet];
    }

    function isBlocked(address wallet) external view override returns (bool) {
        return blockedWallets[wallet];
    }

    // ── Admin functions ───────────────────────────────────────────────────────

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function blockWallet(address wallet) external onlyOwner {
        blockedWallets[wallet] = true;
        emit WalletBlocked(wallet);
    }

    function unblockWallet(address wallet) external onlyOwner {
        blockedWallets[wallet] = false;
        emit WalletUnblocked(wallet);
    }
}
