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
        // AccessControl exposes paused() directly via the ABI
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

    /**
     * @param _campaignManager  Address of deployed CampaignManager
     * @param _fundingVault     Address of deployed FundingVault
     * @param _rewardToken      Address of deployed RewardToken
     * @param _accessControl    Address of deployed AccessControl
     */
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
     *      Signature matches STARTUPFUND_ABI exactly.
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
    ) external notPaused notBlocked onlyRegistered returns (uint256) {
        // Forward via low-level call to avoid "stack too deep" (10 params + modifiers
        // exceed the EVM's 16-slot stack limit when called through the interface).
        bytes memory payload = abi.encodeWithSignature(
            "createCampaign(string,string,string,string,string,string,uint256,uint256,uint256,string)",
            title, slug, description, shortDescription, imageUrl,
            category, goalAmount, minContribution, deadline, tokenSymbol
        );
        (bool ok, bytes memory result) = address(campaignManager).call(payload);
        require(ok, "StartupFund: createCampaign failed");
        uint256 campaignId = abi.decode(result, (uint256));
        emit CampaignCreated(campaignId, msg.sender);
        return campaignId;
    }

    /**
     * @dev Contributes ETH to a campaign.
     *      - Campaign must be ACTIVE and before deadline.
     *      - msg.value must be >= minContribution.
     *      - On success, status is re-evaluated (may flip to FUNDED).
     *      - If newly FUNDED, reward tokens are minted immediately.
     */
    function fundCampaign(uint256 campaignId)
        external
        payable
        notPaused
        notBlocked
        onlyRegistered
    {
        // ── Checks ────────────────────────────────────────────────────────────
        (
            address creator,
            ,
            ,
            uint256 deadline,
            uint8   status
        ) = campaignManager.getCampaign(campaignId);

        require(status == 0,                          "StartupFund: campaign not active"); // 0 = ACTIVE
        require(block.timestamp < deadline,           "StartupFund: campaign deadline passed");
        require(msg.sender != creator,                "StartupFund: creator cannot fund own campaign");

        // fetch minContribution from CampaignManager stats
        // (getCampaign returns limited fields; minContribution lives in stats)
        // We re-read it via the ICampaign-extended interface trick below.
        // To avoid an extra interface, we cast directly.
        (uint256 minContribution) = _getMinContribution(campaignId);
        require(msg.value >= minContribution,         "StartupFund: below minimum contribution");

        // ── Effects (via CampaignManager) ─────────────────────────────────────
        bool isNew = fundingVault.getContribution(campaignId, msg.sender) == 0;
        _updateCampaignManager(campaignId, msg.value, isNew);

        // ── Interactions ──────────────────────────────────────────────────────
        // Forward ETH to vault
        fundingVault.deposit{value: msg.value}(campaignId, msg.sender);

        // Re-evaluate status — may become FUNDED
        campaignManager.checkStatus(campaignId);

        // If campaign just became FUNDED, mint reward tokens for all contributors
        (, , , , uint8 newStatus) = campaignManager.getCampaign(campaignId);
        if (newStatus == 1) { // 1 = FUNDED
            _mintRewardsForAll(campaignId);
        }

        emit Funded(campaignId, msg.sender, msg.value);
    }

    /**
     * @dev Creator withdraws funds after campaign is FUNDED.
     *      - Only callable once (fundsReleased flag in FundingVault).
     *      - Reward tokens are minted first if not yet done.
     */
    function withdraw(uint256 campaignId)
        external
        notPaused
        notBlocked
    {
        // ── Checks ────────────────────────────────────────────────────────────
        (
            address creator,
            ,
            ,
            ,
            uint8 status
        ) = campaignManager.getCampaign(campaignId);

        require(msg.sender == creator,                "StartupFund: not campaign creator");
        require(status == 1,                          "StartupFund: campaign not funded"); // 1 = FUNDED
        require(!fundingVault.fundsReleased(campaignId), "StartupFund: already withdrawn");

        // ── Effects: mint rewards first (if any unminted) ─────────────────────
        _mintRewardsForAll(campaignId);

        // ── Interactions ──────────────────────────────────────────────────────
        // FundingVault handles the actual ETH transfer (CEI inside vault)
        // We emit here with the total (read before release)
        uint256 total = _campaignVaultBalance(campaignId);
        fundingVault.releaseFunds(campaignId, creator);

        emit Withdrawn(campaignId, creator, total);
    }

    /**
     * @dev Contributor claims a refund after campaign is CANCELLED.
     *      - Contributor must have a non-zero contribution.
     */
    function claimRefund(uint256 campaignId)
        external
        notPaused
        notBlocked
    {
        // ── Checks ────────────────────────────────────────────────────────────
        (, , , uint256 deadline, uint8 status) = campaignManager.getCampaign(campaignId);

        // Auto-cancel if deadline passed and still ACTIVE (not flagged)
        if (status == 0 && block.timestamp >= deadline) {
            campaignManager.checkStatus(campaignId);
            (, , , , status) = campaignManager.getCampaign(campaignId);
        }

        require(status == 2 || status == 3,           "StartupFund: campaign not cancelled or flagged"); // 2 = CANCELLED, 3 = FLAGGED

        uint256 contribution = fundingVault.getContribution(campaignId, msg.sender);
        require(contribution > 0,                     "StartupFund: no contribution to refund");

        // ── Effects (inside vault, CEI pattern) ───────────────────────────────
        // FundingVault zeroes out contribution before transferring

        // ── Interactions ──────────────────────────────────────────────────────
        fundingVault.issueRefund(campaignId, msg.sender);

        emit Refunded(campaignId, msg.sender, contribution);
    }

    /**
     * @dev Community member flags a suspicious campaign.
     *      - Only registered, unblocked wallets can flag.
     *      - Each wallet can flag a campaign at most once.
     *      - Creator cannot flag their own campaign.
     *      - Only ACTIVE campaigns can be flagged.
     *      - When flagCount reaches FLAG_THRESHOLD, the campaign is set to FLAGGED
     *        (contributors can then claim refunds).
     */
    function flagCampaign(uint256 campaignId)
        external
        notPaused
        notBlocked
        onlyRegistered
    {
        (address creator, , , , uint8 status) = campaignManager.getCampaign(campaignId);

        require(status == 0,                             "StartupFund: campaign not active");  // 0 = ACTIVE
        require(msg.sender != creator,                   "StartupFund: creator cannot flag own campaign");
        require(!hasFlagged[campaignId][msg.sender],     "StartupFund: already flagged");

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
     *      - Only callable while campaign is still ACTIVE (threshold not yet hit).
     *      - Caller must have previously flagged the campaign.
     */
    function unflagCampaign(uint256 campaignId)
        external
        notPaused
        notBlocked
        onlyRegistered
    {
        (, , , , uint8 status) = campaignManager.getCampaign(campaignId);
        require(status == 0,                             "StartupFund: campaign not active");
        require(hasFlagged[campaignId][msg.sender],      "StartupFund: not flagged");

        hasFlagged[campaignId][msg.sender] = false;
        flagCount[campaignId]--;

        emit CampaignUnflagged(campaignId, msg.sender, flagCount[campaignId]);
    }

    // ── Read functions (match STARTUPFUND_ABI) ────────────────────────────────

    /**
     * @dev Proxies to CampaignManager.campaignCount().
     *      Named totalCampaigns() to match frontend ABI.
     */
    function totalCampaigns() external view returns (uint256) {
        // campaignManager stores count — we read it via the interface
        // ICampaign doesn't expose campaignCount, so we cast to the full contract
        return _campaignCount();
    }

    /**
     * @dev Proxies to AccessControl.isRegistered().
     */
    function isRegistered(address wallet) external view returns (bool) {
        return accessControl.isRegistered(wallet);
    }

    /**
     * @dev Returns the RewardToken balance for a wallet.
     */
    function tokenBalanceOf(address wallet) external view returns (uint256) {
        return rewardToken.balanceOf(wallet);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /**
     * @dev Reads minContribution from CampaignManager.
     *      CampaignManager exposes getCampaignStats which includes minContribution.
     */
    function _getMinContribution(uint256 campaignId) internal view returns (uint256 minContribution) {
        (bool ok, bytes memory data) = address(campaignManager).staticcall(
            abi.encodeWithSignature("getCampaignStats(uint256)", campaignId)
        );
        require(ok, "StartupFund: stats read failed");
        (, , uint256 minC, , , , ) =
            abi.decode(data, (uint256, uint256, uint256, uint256, uint8, string, uint256));
        return minC;
    }

    /**
     * @dev Calls CampaignManager.updateRaisedAmount().
     */
    function _updateCampaignManager(uint256 campaignId, uint256 amount, bool isNew) internal {
        (bool ok, ) = address(campaignManager).call(
            abi.encodeWithSignature(
                "updateRaisedAmount(uint256,uint256,bool)",
                campaignId,
                amount,
                isNew
            )
        );
        require(ok, "StartupFund: updateRaisedAmount failed");
    }

    /**
     * @dev Reads campaignCount from CampaignManager.
     */
    function _campaignCount() internal view returns (uint256) {
        (bool ok, bytes memory data) = address(campaignManager).staticcall(
            abi.encodeWithSignature("campaignCount()")
        );
        require(ok, "StartupFund: campaignCount failed");
        return abi.decode(data, (uint256));
    }

    /**
     * @dev Returns the total ETH held by FundingVault for a campaign.
     */
    function _campaignVaultBalance(uint256 campaignId) internal view returns (uint256) {
        return fundingVault.campaignBalance(campaignId);
    }

    /**
     * @dev Mints reward tokens (1 token per 1 wei contributed) to all
     *      contributors of a campaign who haven't been rewarded yet.
     *      Called on FUNDED status — idempotent via rewardMinted flag.
     */
    function _mintRewardsForAll(uint256 campaignId) internal {
        address[] memory contributors = fundingVault.getContributors(campaignId);

        for (uint256 i = 0; i < contributors.length; i++) {
            address contributor = contributors[i];
            if (rewardMinted[campaignId][contributor]) continue;

            uint256 amount = fundingVault.getContribution(campaignId, contributor);
            if (amount == 0) continue; // refunded contributor — skip

            rewardMinted[campaignId][contributor] = true;
            rewardToken.mint(contributor, amount);
            emit RewardMinted(campaignId, contributor, amount);
        }
    }

    /**
     * @dev Reject direct ETH sends.
     */
    receive() external payable {
        revert("StartupFund: use fundCampaign");
    }
}
