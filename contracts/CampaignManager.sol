// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./ICampaign.sol";

/**
 * @title CampaignManager
 * @dev Stores and manages all campaign data. Does NOT hold ETH.
 *      Only the StartupFund contract (set as authorized) can write state.
 */
contract CampaignManager is ICampaign {

    // ── Enums & Structs ───────────────────────────────────────────────────────

    enum CampaignStatus { ACTIVE, FUNDED, CANCELLED }

    struct Campaign {
        uint256 id;
        address creator;
        string  title;
        string  slug;
        string  description;
        string  shortDescription;
        string  imageUrl;
        string  category;
        uint256 goalAmount;       // in wei
        uint256 raisedAmount;     // in wei
        uint256 minContribution;  // in wei
        uint256 deadline;         // Unix timestamp
        CampaignStatus status;
        string  tokenSymbol;
        uint256 backersCount;
    }

    // ── State ─────────────────────────────────────────────────────────────────

    mapping(uint256 => Campaign) private campaigns;
    uint256 public campaignCount;
    address public owner;
    address public authorized; // = StartupFund contract address

    // ── Events ────────────────────────────────────────────────────────────────

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 goalAmount,
        uint256 deadline
    );
    event CampaignFunded(uint256 indexed campaignId, uint256 totalRaised);
    event CampaignCancelled(uint256 indexed campaignId);

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "CampaignManager: not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == authorized, "CampaignManager: not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Called once after StartupFund is deployed.
     */
    function setAuthorized(address _authorized) external onlyOwner {
        require(_authorized != address(0), "CampaignManager: zero address");
        authorized = _authorized;
    }

    // ── Write functions (only callable by StartupFund) ────────────────────────

    /**
     * @dev Creates a new campaign. Called by StartupFund.createCampaign().
     *      Function signature must exactly match StartupFund ABI.
     */
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
    ) external override onlyAuthorized returns (uint256 campaignId) {
        // Validations
        require(goalAmount > 0,                            "Campaign: goal must be > 0");
        require(minContribution >= 1e15,                   "Campaign: min contribution >= 0.001 ETH");
        require(deadline > block.timestamp + 1 days,      "Campaign: deadline too soon (min 1 day)");
        require(deadline <= block.timestamp + 60 days,    "Campaign: deadline too far (max 60 days)");

        campaignId = campaignCount;

        campaigns[campaignId] = Campaign({
            id:               campaignId,
            creator:          tx.origin,   // the wallet that signed the tx (via StartupFund)
            title:            title,
            slug:             slug,
            description:      description,
            shortDescription: shortDescription,
            imageUrl:         imageUrl,
            category:         category,
            goalAmount:       goalAmount,
            raisedAmount:     0,
            minContribution:  minContribution,
            deadline:         deadline,
            status:           CampaignStatus.ACTIVE,
            tokenSymbol:      tokenSymbol,
            backersCount:     0
        });

        campaignCount++;

        emit CampaignCreated(campaignId, tx.origin, goalAmount, deadline);
    }

    /**
     * @dev Updates the raised amount and backer count. Called by StartupFund.fundCampaign().
     */
    function updateRaisedAmount(
        uint256 campaignId,
        uint256 amount,
        bool    isNewContributor
    ) external onlyAuthorized {
        campaigns[campaignId].raisedAmount += amount;
        if (isNewContributor) {
            campaigns[campaignId].backersCount++;
        }
    }

    /**
     * @dev Evaluates and updates the campaign status.
     *      - Goal reached at any time → FUNDED
     *      - Deadline passed + goal not met → CANCELLED
     *      Called by StartupFund after every contribution, withdraw, and refund.
     *      Implements ICampaign.checkStatus().
     */
    function checkStatus(uint256 campaignId) external override onlyAuthorized {
        Campaign storage c = campaigns[campaignId];

        if (c.status != CampaignStatus.ACTIVE) return; // already settled

        if (c.raisedAmount >= c.goalAmount) {
            c.status = CampaignStatus.FUNDED;
            emit CampaignFunded(campaignId, c.raisedAmount);
        } else if (block.timestamp >= c.deadline) {
            c.status = CampaignStatus.CANCELLED;
            emit CampaignCancelled(campaignId);
        }
    }

    // ── Read functions (public) ───────────────────────────────────────────────

    /**
     * @dev Required by ICampaign — returns core campaign fields.
     */
    function getCampaign(uint256 campaignId) external view override returns (
        address creator,
        uint256 goalAmount,
        uint256 raisedAmount,
        uint256 deadline,
        uint8   status
    ) {
        Campaign storage c = campaigns[campaignId];
        return (c.creator, c.goalAmount, c.raisedAmount, c.deadline, uint8(c.status));
    }

    /**
     * @dev Returns metadata fields. Called by useCampaigns.ts.
     */
    function getCampaignMeta(uint256 campaignId) external view returns (
        uint256 id,
        address creator,
        string memory title,
        string memory slug,
        string memory shortDescription,
        string memory imageUrl,
        string memory category
    ) {
        Campaign storage c = campaigns[campaignId];
        return (c.id, c.creator, c.title, c.slug, c.shortDescription, c.imageUrl, c.category);
    }

    /**
     * @dev Returns numeric/status fields. Called by useCampaigns.ts.
     */
    function getCampaignStats(uint256 campaignId) external view returns (
        uint256 goalAmount,
        uint256 raisedAmount,
        uint256 minContribution,
        uint256 deadline,
        uint8   status,
        string memory tokenSymbol,
        uint256 backersCount
    ) {
        Campaign storage c = campaigns[campaignId];
        return (
            c.goalAmount,
            c.raisedAmount,
            c.minContribution,
            c.deadline,
            uint8(c.status),
            c.tokenSymbol,
            c.backersCount
        );
    }

    /**
     * @dev Returns the full description. Called by useCampaigns.ts.
     */
    function getCampaignDescription(uint256 campaignId) external view returns (string memory) {
        return campaigns[campaignId].description;
    }

    /**
     * @dev Returns the status as uint8. Called by useCampaigns.ts.
     */
    function getStatus(uint256 campaignId) external view returns (uint8) {
        return uint8(campaigns[campaignId].status);
    }
}
