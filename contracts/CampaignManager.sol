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

    enum CampaignStatus { ACTIVE, FUNDED, CANCELLED, FLAGGED }

    struct Campaign {
        uint256 id;
        address creator;
        string  title;
        string  slug;
        string  description;
        string  shortDescription;
        string  imageUrl;
        string  category;
        uint256 goalAmount;           // in wei
        uint256 raisedAmount;         // in wei
        uint256 minContribution;      // in wei
        uint256 deadline;             // Unix timestamp
        CampaignStatus status;
        string  tokenSymbol;
        uint256 backersCount;
        uint256 profitReturnRate;     // 0–100 (percentage)
        uint256 profitReturnDeadline; // Unix timestamp, must be > deadline
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
    event CampaignUpdated(uint256 indexed campaignId);
    event CampaignFunded(uint256 indexed campaignId, uint256 totalRaised);
    event CampaignCancelled(uint256 indexed campaignId);
    event CampaignFlagged(uint256 indexed campaignId);

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
     */
    function createCampaign(CampaignParams calldata p) external override onlyAuthorized returns (uint256 campaignId) {
        require(p.goalAmount > 0,                              "Campaign: goal must be > 0");
        require(p.minContribution >= 1e15,                     "Campaign: min contribution >= 0.001 ETH");
        require(p.minContribution <= p.goalAmount,             "Campaign: min contribution exceeds goal");
        require(p.deadline > block.timestamp + 1 days,        "Campaign: deadline too soon (min 1 day)");
        require(p.deadline <= block.timestamp + 60 days,      "Campaign: deadline too far (max 60 days)");
        require(p.profitReturnRate <= 100,                     "Campaign: profit return rate must be 0-100");
        require(p.profitReturnDeadline > p.deadline,           "Campaign: profit return deadline must be after campaign deadline");

        campaignId = campaignCount;

        campaigns[campaignId] = Campaign({
            id:                   campaignId,
            creator:              tx.origin,
            title:                p.title,
            slug:                 p.slug,
            description:          p.description,
            shortDescription:     p.shortDescription,
            imageUrl:             p.imageUrl,
            category:             p.category,
            goalAmount:           p.goalAmount,
            raisedAmount:         0,
            minContribution:      p.minContribution,
            deadline:             p.deadline,
            status:               CampaignStatus.ACTIVE,
            tokenSymbol:          p.tokenSymbol,
            backersCount:         0,
            profitReturnRate:     p.profitReturnRate,
            profitReturnDeadline: p.profitReturnDeadline
        });

        campaignCount++;

        emit CampaignCreated(campaignId, tx.origin, p.goalAmount, p.deadline);
    }

    /**
     * @dev Updates editable campaign fields. Only allowed before any contributor funds.
     *      Called by StartupFund.updateCampaign().
     */
    function updateCampaign(
        uint256 campaignId,
        string memory title,
        string memory description,
        string memory shortDescription,
        string memory imageUrl
    ) external onlyAuthorized {
        Campaign storage c = campaigns[campaignId];
        require(c.status == CampaignStatus.ACTIVE,  "Campaign: not active");
        require(c.backersCount == 0,                "Campaign: cannot edit after funding starts");
        c.title            = title;
        c.description      = description;
        c.shortDescription = shortDescription;
        c.imageUrl         = imageUrl;
        emit CampaignUpdated(campaignId);
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
     * @dev Marks a campaign as FLAGGED by community vote. Called by StartupFund.flagCampaign().
     */
    function flagCampaign(uint256 campaignId) external onlyAuthorized {
        Campaign storage c = campaigns[campaignId];
        require(c.status == CampaignStatus.ACTIVE, "CampaignManager: not active");
        c.status = CampaignStatus.FLAGGED;
        emit CampaignFlagged(campaignId);
    }

    /**
     * @dev Evaluates and updates the campaign status.
     *      - Goal reached → FUNDED
     *      - Deadline passed + goal not met → CANCELLED
     */
    function checkStatus(uint256 campaignId) external override onlyAuthorized {
        Campaign storage c = campaigns[campaignId];

        if (c.status != CampaignStatus.ACTIVE) return;

        if (c.raisedAmount >= c.goalAmount) {
            c.status = CampaignStatus.FUNDED;
            emit CampaignFunded(campaignId, c.raisedAmount);
        } else if (block.timestamp >= c.deadline) {
            c.status = CampaignStatus.CANCELLED;
            emit CampaignCancelled(campaignId);
        }
    }

    // ── Read functions (public) ───────────────────────────────────────────────

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

    function getCampaignStats(uint256 campaignId) external view returns (
        uint256 goalAmount,
        uint256 raisedAmount,
        uint256 minContribution,
        uint256 deadline,
        uint8   status,
        string memory tokenSymbol,
        uint256 backersCount,
        uint256 profitReturnRate,
        uint256 profitReturnDeadline
    ) {
        Campaign storage c = campaigns[campaignId];
        return (
            c.goalAmount,
            c.raisedAmount,
            c.minContribution,
            c.deadline,
            uint8(c.status),
            c.tokenSymbol,
            c.backersCount,
            c.profitReturnRate,
            c.profitReturnDeadline
        );
    }

    function getCampaignDescription(uint256 campaignId) external view returns (string memory) {
        return campaigns[campaignId].description;
    }

    function getStatus(uint256 campaignId) external view returns (uint8) {
        return uint8(campaigns[campaignId].status);
    }
}
