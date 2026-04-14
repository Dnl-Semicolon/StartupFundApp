// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * @title FundingVault
 * @dev Holds all ETH contributions. Releases or refunds on instruction
 *      from the authorized StartupFund contract only.
 *      Uses CEI (Checks-Effects-Interactions) pattern on all ETH transfers.
 */
contract FundingVault {

    // ── State ─────────────────────────────────────────────────────────────────

    address public owner;
    address public authorized; // = StartupFund contract address

    // campaignId → contributor → amount deposited (wei)
    mapping(uint256 => mapping(address => uint256)) private contributions;

    // campaignId → ordered list of unique contributors
    mapping(uint256 => address[]) private contributorList;

    // campaignId → contributor → already in list?
    mapping(uint256 => mapping(address => bool)) private isContributor;

    // campaignId → true once the creator has withdrawn
    mapping(uint256 => bool) public fundsReleased;

    // ── Events ────────────────────────────────────────────────────────────────

    event Deposited(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event FundsReleased(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event RefundIssued(uint256 indexed campaignId, address indexed contributor, uint256 amount);

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "FundingVault: not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == authorized, "FundingVault: not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Called once after StartupFund is deployed.
     */
    function setAuthorized(address _authorized) external onlyOwner {
        require(_authorized != address(0), "FundingVault: zero address");
        authorized = _authorized;
    }

    // ── Write functions (only callable by StartupFund) ────────────────────────

    /**
     * @dev Records a contribution for campaignId from contributor.
     *      ETH is sent directly to this contract (via StartupFund forwarding msg.value).
     */
    function deposit(
        uint256 campaignId,
        address contributor
    ) external payable onlyAuthorized {
        require(msg.value > 0, "FundingVault: zero deposit");

        // Track unique contributors
        if (!isContributor[campaignId][contributor]) {
            isContributor[campaignId][contributor] = true;
            contributorList[campaignId].push(contributor);
        }

        contributions[campaignId][contributor] += msg.value;

        emit Deposited(campaignId, contributor, msg.value);
    }

    /**
     * @dev Releases the full campaign balance to the creator.
     *      Called by StartupFund.withdraw() after goal is met.
     *      CEI: mark released before transferring ETH.
     */
    function releaseFunds(
        uint256 campaignId,
        address creatorAddress
    ) external onlyAuthorized {
        require(!fundsReleased[campaignId], "FundingVault: already released");

        uint256 total = _campaignBalance(campaignId);
        require(total > 0, "FundingVault: nothing to release");

        // Effects
        fundsReleased[campaignId] = true;

        // Interactions
        (bool success, ) = payable(creatorAddress).call{value: total}("");
        require(success, "FundingVault: transfer failed");

        emit FundsReleased(campaignId, creatorAddress, total);
    }

    /**
     * @dev Refunds a single contributor's contribution for campaignId.
     *      Called by StartupFund.claimRefund() after campaign is cancelled.
     *      CEI: zero out balance before transferring ETH.
     */
    function issueRefund(
        uint256 campaignId,
        address contributor
    ) external onlyAuthorized {
        uint256 amount = contributions[campaignId][contributor];
        require(amount > 0, "FundingVault: nothing to refund");

        // Effects
        contributions[campaignId][contributor] = 0;

        // Interactions
        (bool success, ) = payable(contributor).call{value: amount}("");
        require(success, "FundingVault: refund failed");

        emit RefundIssued(campaignId, contributor, amount);
    }

    // ── Read functions ────────────────────────────────────────────────────────

    /**
     * @dev Returns the contribution amount for a specific contributor.
     */
    function getContribution(
        uint256 campaignId,
        address contributor
    ) external view returns (uint256) {
        return contributions[campaignId][contributor];
    }

    /**
     * @dev Returns all contributor addresses for a campaign.
     */
    function getContributors(uint256 campaignId) external view returns (address[] memory) {
        return contributorList[campaignId];
    }

    /**
     * @dev Returns total ETH held for a campaign (sum of all contributor deposits).
     */
    function campaignBalance(uint256 campaignId) external view returns (uint256) {
        return _campaignBalance(campaignId);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _campaignBalance(uint256 campaignId) internal view returns (uint256 total) {
        address[] storage list = contributorList[campaignId];
        for (uint256 i = 0; i < list.length; i++) {
            total += contributions[campaignId][list[i]];
        }
    }

    /**
     * @dev Fallback: reject direct ETH sends (must go through StartupFund).
     */
    receive() external payable {
        revert("FundingVault: use StartupFund");
    }
}
