// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title RewardToken
 * @dev ERC-20 reward token minted 1:1 with ETH contributed on campaign success.
 *      Only the StartupFund contract (set as minter) can mint tokens.
 */
contract RewardToken is ERC20 {
    address public minter;

    event MinterChanged(address indexed oldMinter, address indexed newMinter);

    constructor() ERC20("StartupFund Token", "SFT") {
        minter = msg.sender;
    }

    /**
     * @dev Transfers minting rights to the StartupFund contract.
     *      Called once after StartupFund is deployed.
     */
    function setMinter(address _minter) external {
        require(msg.sender == minter, "RewardToken: not authorized");
        require(_minter != address(0), "RewardToken: zero address");
        emit MinterChanged(minter, _minter);
        minter = _minter;
    }

    /**
     * @dev Mints reward tokens to a contributor.
     *      Only callable by the StartupFund contract.
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "RewardToken: not authorized");
        _mint(to, amount);
    }
}
