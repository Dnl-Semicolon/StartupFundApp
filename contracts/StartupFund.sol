// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./ICampaign.sol";
import "./IVerification.sol";
import "./IFundingVault.sol";
import "./IRewardToken.sol";

/**
 * @title StartupFund
 * @dev Orchestrates all user-facing actions.
 *      - Does NOT hold ETH (all ETH goes to FundingVault).
 *      - Delegates campaign data to CampaignManager.
 *      - Delegates access control to AccessControl.
 *      - Mints reward tokens via RewardToken.
 *
 * Function signatures must EXACTLY match STARTUPFUND_ABI in src/lib/contracts.ts.
 */
contract StartupFund {

    // ── External contracts ────────────────────────────────────────────────────

    ICampaign      public campaignManager;
    IFundingVault  public fundingVault;
    IRewardToken   public rewardToken;
    IVerification  public accessControl;

    // ── State ─────────────────────────────────────────────────────────────────

    address public owner;

    // campaignId → contributor → reward already minted
    mapping(uint256 => mapping(address => bool)) private rewardMinted;

    // ── Flagging ──────────────────────────────────────────────────────────────

    uint256 public constant FLAG_THRESHOLD = 5;
    mapping(uint256 => mapping(address => bool)) public hasFlagged;
    mapping(uint256 => uint256) public flagCount;

    // ── Events ────────────────────────────────────────────────────────────────

    event CampaignCreated(uint256 indexed campaignId, address indexed creator);
    event CampaignUpdated(uint256 indexed campaignId, address indexed creator);
    event Funded(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event Withdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event Refunded(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event RewardMinted(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event CampaignFlagged(uint256 indexed campaignId, address indexed flagger, uint256 totalFlags);
    event CampaignUnflagged(uint256 indexed campaignId, address indexed unflagged, uint256 totalFlags);

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "StartupFund: not owner");
        _;
    }

    modifier notPaused() {
        (bool ok, bytes memory data) = address(accessControl).staticcall(
            abi.encodeWithSignature("paused()")
        );
        require(ok, "StartupFund: pause check failed");
        bool isPaused = abi.decode(data, (bool));
        require(!isPaused, "StartupFund: platform paused");
        _;
    }

    modifier notBlocked() {
        require(!accessControl.isBlocked(msg.sender), "StartupFund: wallet blocked");
        _;
    }

    modifier onlyRegistered() {
        require(accessControl.isRegistered(msg.sender), "StartupFund: not registered");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(
        address _campaignManager,
        address _fundingVault,
        address _rewardToken,
        address _accessControl
    ) {
        require(_campaignManager != address(0), "SF: zero CM");
        require(_fundingVault    != address(0), "SF: zero FV");
        require(_rewardToken     != address(0), "SF: zero RT");
        require(_accessControl   != address(0), "SF: zero AC");

        campaignManager = ICampaign(_campaignManager);
        fundingVault    = IFundingVault(_fundingVault);
        rewardToken     = IRewardToken(_rewardToken);
        accessControl   = IVerification(_accessControl);
        owner           = msg.sender;
    }

    // ── User-facing write functions ───────────────────────────────────────────

    /**
     * @dev Creates a new campaign. Only registered, unblocked users.
     */
    function createCampaign(ICampaign.CampaignParams calldata p)
        external
        notPaused
        notBlocked
        onlyRegistered
        returns (uint256)
    {
        uint256 campaignId = campaignManager.createCampaign(p);
        emit CampaignCreated(campaignId, msg.sender);
        return campaignId;
    }

    /**
     * @dev Updates editable campaign fields. Only creator, only before first contribution.
     */
    function updateCampaign(
        uint256 campaignId,
        string memory title,
        string memory description,
        string memory shortDescription,
        string memory imageUrl
    ) external notPaused notBlocked onlyRegistered {
        (address creator, , , , uint8 status) = campaignManager.getCampaign(campaignId);
        require(msg.sender == creator, "StartupFund: not campaign creator");
        require(status == 0,          "StartupFund: campaign not active");

        (bool ok, ) = address(campaignManager).call(
            abi.encodeWithSignature(
                "updateCampaign(uint256,string,string,string,string)",
                campaignId, title, description, shortDescription, imageUrl
            )
        );
        require(ok, "StartupFund: updateCampaign failed");
        emit CampaignUpdated(campaignId, msg.sender);
    }

    /**
     * @dev Contributes ETH to a campaign.
     */
    function fundCampaign(uint256 campaignId)
        external
        payable
        notPaused
        notBlocked
        onlyRegistered
    {
        (
            address creator,
            ,
            ,
            uint256 deadline,
            uint8   status
        ) = campaignManager.getCampaign(campaignId);

        require(status == 0,                 "StartupFund: campaign not active");
        require(block.timestamp < deadline,  "StartupFund: campaign deadline passed");
        require(msg.sender != creator,       "StartupFund: creator cannot fund own campaign");

        (uint256 minContribution) = _getMinContribution(campaignId);
        require(msg.value >= minContribution, "StartupFund: below minimum contribution");

        bool isNew = fundingVault.getContribution(campaignId, msg.sender) == 0;
        _updateCampaignManager(campaignId, msg.value, isNew);

        fundingVault.deposit{value: msg.value}(campaignId, msg.sender);

        campaignManager.checkStatus(campaignId);

        (, , , , uint8 newStatus) = campaignManager.getCampaign(campaignId);
        if (newStatus == 1) {
            _mintRewardsForAll(campaignId);
        }

        emit Funded(campaignId, msg.sender, msg.value);
    }

    /**
     * @dev Creator withdraws funds after campaign is FUNDED.
     */
    function withdraw(uint256 campaignId)
        external
        notPaused
        notBlocked
    {
        (
            address creator,
            ,
            ,
            ,
            uint8 status
        ) = campaignManager.getCampaign(campaignId);

        require(msg.sender == creator,                   "StartupFund: not campaign creator");
        require(status == 1,                             "StartupFund: campaign not funded");
        require(!fundingVault.fundsReleased(campaignId), "StartupFund: already withdrawn");

        _mintRewardsForAll(campaignId);

        uint256 total = _campaignVaultBalance(campaignId);
        fundingVault.releaseFunds(campaignId, creator);

        emit Withdrawn(campaignId, creator, total);
    }

    /**
     * @dev Contributor claims a refund after campaign is CANCELLED or FLAGGED.
     */
    function claimRefund(uint256 campaignId)
        external
        notPaused
        notBlocked
    {
        (, , , uint256 deadline, uint8 status) = campaignManager.getCampaign(campaignId);

        if (status == 0 && block.timestamp >= deadline) {
            campaignManager.checkStatus(campaignId);
            (, , , , status) = campaignManager.getCampaign(campaignId);
        }

        require(status == 2 || status == 3, "StartupFund: campaign not cancelled or flagged");

        uint256 contribution = fundingVault.getContribution(campaignId, msg.sender);
        require(contribution > 0, "StartupFund: no contribution to refund");

        fundingVault.issueRefund(campaignId, msg.sender);

        emit Refunded(campaignId, msg.sender, contribution);
    }

    /**
     * @dev Community member flags a suspicious campaign.
     */
    function flagCampaign(uint256 campaignId)
        external
        notPaused
        notBlocked
        onlyRegistered
    {
        (address creator, , , , uint8 status) = campaignManager.getCampaign(campaignId);

        require(status == 0,                          "StartupFund: campaign not active");
        require(msg.sender != creator,                "StartupFund: creator cannot flag own campaign");
        require(!hasFlagged[campaignId][msg.sender],  "StartupFund: already flagged");

        hasFlagged[campaignId][msg.sender] = true;
        flagCount[campaignId]++;

        emit CampaignFlagged(campaignId, msg.sender, flagCount[campaignId]);

        if (flagCount[campaignId] >= FLAG_THRESHOLD) {
            (bool ok, ) = address(campaignManager).call(
                abi.encodeWithSignature("flagCampaign(uint256)", campaignId)
            );
            require(ok, "StartupFund: flagCampaign on manager failed");
        }
    }

    /**
     * @dev Removes the caller's flag from a campaign.
     */
    function unflagCampaign(uint256 campaignId)
        external
        notPaused
        notBlocked
        onlyRegistered
    {
        (, , , , uint8 status) = campaignManager.getCampaign(campaignId);
        require(status == 0,                         "StartupFund: campaign not active");
        require(hasFlagged[campaignId][msg.sender],  "StartupFund: not flagged");

        hasFlagged[campaignId][msg.sender] = false;
        flagCount[campaignId]--;

        emit CampaignUnflagged(campaignId, msg.sender, flagCount[campaignId]);
    }

    // ── Read functions ────────────────────────────────────────────────────────

    function totalCampaigns() external view returns (uint256) {
        return _campaignCount();
    }

    function isRegistered(address wallet) external view returns (bool) {
        return accessControl.isRegistered(wallet);
    }

    function tokenBalanceOf(address wallet) external view returns (uint256) {
        return rewardToken.balanceOf(wallet);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    function _getMinContribution(uint256 campaignId) internal view returns (uint256 minContribution) {
        (bool ok, bytes memory data) = address(campaignManager).staticcall(
            abi.encodeWithSignature("getCampaignStats(uint256)", campaignId)
        );
        require(ok, "StartupFund: stats read failed");
        (, , uint256 minC, , , , ) =
            abi.decode(data, (uint256, uint256, uint256, uint256, uint8, string, uint256));
        return minC;
    }

    function _updateCampaignManager(uint256 campaignId, uint256 amount, bool isNew) internal {
        (bool ok, ) = address(campaignManager).call(
            abi.encodeWithSignature(
                "updateRaisedAmount(uint256,uint256,bool)",
                campaignId, amount, isNew
            )
        );
        require(ok, "StartupFund: updateRaisedAmount failed");
    }

    function _campaignCount() internal view returns (uint256) {
        (bool ok, bytes memory data) = address(campaignManager).staticcall(
            abi.encodeWithSignature("campaignCount()")
        );
        require(ok, "StartupFund: campaignCount failed");
        return abi.decode(data, (uint256));
    }

    function _campaignVaultBalance(uint256 campaignId) internal view returns (uint256) {
        return fundingVault.campaignBalance(campaignId);
    }

    function _mintRewardsForAll(uint256 campaignId) internal {
        address[] memory contributors = fundingVault.getContributors(campaignId);

        for (uint256 i = 0; i < contributors.length; i++) {
            address contributor = contributors[i];
            if (rewardMinted[campaignId][contributor]) continue;

            uint256 amount = fundingVault.getContribution(campaignId, contributor);
            if (amount == 0) continue;

            rewardMinted[campaignId][contributor] = true;
            rewardToken.mint(contributor, amount);
            emit RewardMinted(campaignId, contributor, amount);
        }
    }

    receive() external payable {
        revert("StartupFund: use fundCampaign");
    }
}
