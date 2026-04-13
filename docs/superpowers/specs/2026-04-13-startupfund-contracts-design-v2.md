# StartupFund Smart Contracts — Design Spec v2
**Date**: 2026-04-13  
**Deadline**: 2026-04-19 (6 days)  
**Team**: 5 members  
**Platform**: Ethereum (Ganache local, Chain ID 1337), Remix IDE  
**Changelog from v1**: Architecture upgraded from 2 contracts → 5 contracts + 2 interfaces, matching the lecturer's contract diagram exactly. Added AccessControl, CampaignManager, FundingVault. Added admin features (pause, block wallet). IPFS noted.

---

## Why This Version Exists

After reading the full assignment docx + 4 diagram images, the lecturer's **contract diagram (image15.png)** shows a specific 5-contract architecture with exact names. v1 used 2 contracts for simplicity — this was too lean and would not match the expected design.

**v2 matches the assignment's expected architecture exactly.**

---

## Architecture Overview

```
Interfaces (2):
  ICampaign.sol          ← defines campaign function signatures
  IVerification.sol      ← defines wallet verification signatures

Contracts (5):
  AccessControl.sol      ← admin: pause/unpause, block wallets, owner
  CampaignManager.sol    ← campaign CRUD, status, milestones
  FundingVault.sol       ← ETH escrow: deposit, release, refund
  RewardToken.sol        ← ERC-20 reward token (OpenZeppelin)
  StartupFund.sol        ← main orchestrator: wires all 4 contracts
```

**Diagram from assignment (image15.png):**
```
            AccessControl
                  |
           StartupFund (main)
          /                 \
<<IVerification>>       <<ICampaign>>
         |                   |
  CampaignManager      FundingVault    RewardToken
```

**Deploy order:**
1. `RewardToken.sol`
2. `AccessControl.sol`
3. `CampaignManager.sol`
4. `FundingVault.sol`
5. `StartupFund.sol` (constructor takes all 4 addresses above)
6. Call `RewardToken.setMinter(startupFundAddress)`
7. Call `FundingVault.setAuthorized(startupFundAddress)`
8. Call `CampaignManager.setAuthorized(startupFundAddress)`

---

## System Architecture (image3.jpg)

```
User → React Browser → MetaMask → signs tx → Ganache → Blockchain
User → Truffle (compile/deploy contracts to Ganache)         [note: we use Remix instead of Truffle — same outcome]
Browser → IPFS (upload image files) → get IPFS hash
Browser stores IPFS hash in contract (not full URL)
```

**IPFS for this assignment:**  
The architecture diagram shows IPFS for file storage. In practice:
- Use [pinata.cloud](https://pinata.cloud) free tier to upload images → get `ipfs://Qm...` hash
- Store that hash string in the Campaign struct as `imageUrl`
- Frontend fetches: `https://gateway.pinata.cloud/ipfs/<hash>`

If IPFS setup is too complex in 6 days: store a regular HTTPS URL in `imageUrl` for the demo and note "production would use IPFS" in the design doc.

---

## Solidity Version

Use `pragma solidity >=0.8.0 <0.9.0;` — matches the sample contract the lecturer provided.

---

## Contract 1: ICampaign.sol (Interface)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface ICampaign {
    function createCampaign(
        string memory title,
        string memory description,
        uint256 goalAmount,
        uint256 deadline,
        string memory tokenSymbol
    ) external returns (uint256 campaignId);

    function getCampaign(uint256 campaignId) external view returns (
        address creator,
        uint256 goalAmount,
        uint256 raisedAmount,
        uint256 deadline,
        uint8 status
    );

    function checkStatus(uint256 campaignId) external;
}
```

**Assignable to**: Person 1. ~20 lines.

---

## Contract 2: IVerification.sol (Interface)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IVerification {
    function isRegistered(address wallet) external view returns (bool);
    function isBlocked(address wallet) external view returns (bool);
    function register() external;
}
```

**Assignable to**: Person 1 (same as ICampaign). ~15 lines.

---

## Contract 3: RewardToken.sol

OpenZeppelin ERC-20. Mintable only by StartupFund contract.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RewardToken is ERC20 {
    address public minter;

    constructor() ERC20("StartupFund Token", "SFT") {
        minter = msg.sender;
    }

    function setMinter(address _minter) external {
        require(msg.sender == minter, "Not authorized");
        minter = _minter;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "Not authorized");
        _mint(to, amount);
    }
}
```

**Assignable to**: Person 1. ~25 lines.  
**Token name**: "StartupFund Token", symbol: "SFT"

---

## Contract 4: AccessControl.sol

Admin functions confirmed in Use Case Diagram (image2.png): pause/unpause, block wallet, redeploy/upgrade.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract AccessControl {
    address public owner;
    bool public paused;

    mapping(address => bool) public blockedWallets;
    mapping(address => bool) public registeredUsers;

    event Paused(address admin);
    event Unpaused(address admin);
    event WalletBlocked(address wallet);
    event WalletUnblocked(address wallet);
    event UserRegistered(address wallet);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier notPaused() {
        require(!paused, "Contract paused");
        _;
    }

    modifier notBlocked() {
        require(!blockedWallets[msg.sender], "Wallet blocked");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // User self-registers with their wallet
    function register() external notBlocked {
        require(!registeredUsers[msg.sender], "Already registered");
        registeredUsers[msg.sender] = true;
        emit UserRegistered(msg.sender);
    }

    function isRegistered(address wallet) external view returns (bool) {
        return registeredUsers[wallet];
    }

    function isBlocked(address wallet) external view returns (bool) {
        return blockedWallets[wallet];
    }

    // Admin functions
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
```

**Assignable to**: Person 2. ~55 lines.

---

## Contract 5: CampaignManager.sol

Campaign CRUD and status transitions. Does NOT hold ETH.

### Data Structures

```solidity
enum CampaignStatus { ACTIVE, FUNDED, CANCELLED }

struct Milestone {
    string title;
    string description;
    uint256 targetAmount;   // in wei
    bool isReached;
}

struct Campaign {
    uint256 id;
    address creator;
    string title;
    string slug;
    string description;
    string shortDescription;
    string imageUrl;        // IPFS hash or URL
    string category;        // "Tech", "AI", "Web3", etc.
    uint256 goalAmount;     // in wei
    uint256 raisedAmount;   // in wei (updated by StartupFund)
    uint256 minContribution; // in wei (min 1e15 = 0.001 ETH)
    uint256 deadline;       // Unix timestamp
    CampaignStatus status;
    string tokenSymbol;     // cosmetic, e.g. "EFLOW"
    uint256 backersCount;
    Milestone[] milestones;
}
```

### State Variables

```solidity
mapping(uint256 => Campaign) public campaigns;
uint256 public campaignCount;
address public authorized;   // = StartupFund contract address
```

### Events

```solidity
event CampaignCreated(uint256 indexed campaignId, address creator, uint256 goalAmount, uint256 deadline);
event CampaignFunded(uint256 indexed campaignId, uint256 totalRaised);
event CampaignCancelled(uint256 indexed campaignId);
```

### Functions

```
createCampaign(title, slug, description, shortDescription, imageUrl, category,
               goalAmount, minContribution, deadline, tokenSymbol, milestones)
  - Validation:
    - goalAmount > 0
    - deadline > block.timestamp + 1 days
    - deadline <= block.timestamp + 60 days
    - minContribution >= 1e15 (0.001 ETH)
  - stores in campaigns[campaignCount++]
  - emits CampaignCreated

checkAndUpdateStatus(campaignId)
  - if deadline passed AND status == ACTIVE:
    - if raisedAmount >= goalAmount: status = FUNDED, emit CampaignFunded
    - else: status = CANCELLED, emit CampaignCancelled

updateRaisedAmount(campaignId, amount)   ← only callable by StartupFund (authorized)
  - campaigns[campaignId].raisedAmount += amount
  - campaigns[campaignId].backersCount++  (if new contributor)

getCampaign(campaignId) returns full Campaign struct

setAuthorized(address)  ← onlyOwner (deployer), called once after deploy
```

**Assignable to**: Person 3. ~100 lines.

---

## Contract 6: FundingVault.sol

ETH escrow. Holds all contributed ETH. Only StartupFund can move funds.

```
State variables:
  mapping(uint256 => uint256) public vaultBalance;          // campaignId → ETH held
  mapping(uint256 => mapping(address => uint256)) public contributions;  // campaignId → contributor → amount
  mapping(uint256 => address[]) public contributorList;     // for token minting loop
  mapping(uint256 => mapping(address => bool)) public refundClaimed;
  mapping(uint256 => bool) public fundsReleased;
  address public authorized;   // = StartupFund contract

Events:
  event Deposited(uint256 indexed campaignId, address contributor, uint256 amount)
  event FundsReleased(uint256 indexed campaignId, address creator, uint256 amount)
  event RefundIssued(uint256 indexed campaignId, address contributor, uint256 amount)

Functions:
  deposit(campaignId, contributor) payable
    - only callable by authorized (StartupFund)
    - if new contributor: contributorList[campaignId].push(contributor)
    - contributions[campaignId][contributor] += msg.value
    - vaultBalance[campaignId] += msg.value
    - emits Deposited

  releaseFunds(campaignId, creatorAddress)
    - only callable by authorized
    - require: fundsReleased[campaignId] == false
    - fundsReleased[campaignId] = true        ← CEI: state before transfer
    - transfer vaultBalance[campaignId] to creatorAddress
    - emits FundsReleased

  issueRefund(campaignId, contributor)
    - only callable by authorized
    - require: refundClaimed[campaignId][contributor] == false
    - amount = contributions[campaignId][contributor]
    - refundClaimed[campaignId][contributor] = true    ← CEI
    - contributions[campaignId][contributor] = 0
    - transfer amount to contributor using .call{value: amount}("")
    - emits RefundIssued

  getContributors(campaignId) returns address[]  ← for token minting loop
  getContribution(campaignId, contributor) returns uint256

  setAuthorized(address)  ← onlyOwner, called once after deploy
```

**ETH transfer pattern**: Always use `.call{value: amount}("")` — not `.transfer()` (matches sample contract).

**Assignable to**: Person 4. ~80 lines.

---

## Contract 7: StartupFund.sol (Main Orchestrator)

Wires all contracts together. Frontend calls this contract only.

```solidity
// references all 4 sub-contracts
CampaignManager public campaignManager;
FundingVault public fundingVault;
RewardToken public rewardToken;
AccessControl public accessControl;

constructor(
    address _campaignManager,
    address _fundingVault,
    address _rewardToken,
    address _accessControl
)
```

### Events

```solidity
event FundingReceived(uint256 indexed campaignId, address contributor, uint256 amount);
event FundsWithdrawn(uint256 indexed campaignId, address creator, uint256 amount);
event RefundClaimed(uint256 indexed campaignId, address contributor, uint256 amount);
event TokensMinted(uint256 indexed campaignId, address contributor, uint256 tokens);
```

### Modifiers (use AccessControl)

```solidity
modifier onlyRegistered() {
    require(accessControl.isRegistered(msg.sender), "Not registered");
    require(!accessControl.isBlocked(msg.sender), "Wallet blocked");
    require(!accessControl.paused(), "Platform paused");
    _;
}
```

### Functions

```
createCampaign(all params)
  - onlyRegistered modifier
  - delegates to campaignManager.createCampaign(...)

fundCampaign(campaignId) payable
  - onlyRegistered
  - read campaign from campaignManager: validate ACTIVE + before deadline + msg.value >= minContribution
  - call fundingVault.deposit{value: msg.value}(campaignId, msg.sender)
  - call campaignManager.updateRaisedAmount(campaignId, msg.value)
  - check if raisedAmount now >= goalAmount → call campaignManager.checkAndUpdateStatus()
  - emits FundingReceived

withdraw(campaignId)
  - campaign = campaignManager.getCampaign(campaignId)
  - require: msg.sender == campaign.creator
  - call campaignManager.checkAndUpdateStatus(campaignId) to ensure status is current
  - require: campaign.status == FUNDED
  - require: !fundingVault.fundsReleased(campaignId)
  
  Step 1: Mint tokens to all contributors (BEFORE releasing ETH)
    - contributors = fundingVault.getContributors(campaignId)
    - loop: rewardToken.mint(contributor, fundingVault.getContribution(campaignId, contributor))
    - emit TokensMinted per contributor
  
  Step 2: Release ETH from vault
    - call fundingVault.releaseFunds(campaignId, msg.sender)
    - emit FundsWithdrawn

claimRefund(campaignId)
  - call campaignManager.checkAndUpdateStatus(campaignId)
  - require: campaign.status == CANCELLED
  - call fundingVault.issueRefund(campaignId, msg.sender)
  - emit RefundClaimed
```

**Assignable to**: Person 5. ~100 lines.

---

## Security Patterns

**CEI (Checks-Effects-Interactions)** — mandatory in `FundingVault.releaseFunds()` and `FundingVault.issueRefund()`:
1. Check all conditions
2. Update state (set flags to prevent re-entry)
3. Transfer ETH last

**ETH Transfer pattern**: Use `.call{value: amount}("")` everywhere — never `.transfer()` or `.send()` (matches sample contract pattern).

**Access control**: `authorized` address pattern in CampaignManager and FundingVault — only StartupFund can call state-changing functions.

---

## 6-Day Sprint Plan (Updated)

### Day 1 (Apr 13) — Interfaces + RewardToken + AccessControl
All 5 read + understand architecture together. Study the contract diagram.
- **Person 1**: `ICampaign.sol` + `IVerification.sol` + `RewardToken.sol` (~60 lines total)
- **Person 2**: `AccessControl.sol` (~55 lines)
- Deploy both to Ganache, test register(), pause(), mint() manually in Remix

### Day 2 (Apr 14) — CampaignManager + FundingVault structs
- **Person 3**: `CampaignManager.sol` — data structures, createCampaign()
- **Person 4**: `FundingVault.sol` — data structures, deposit()
- Deploy separately, call functions in Remix, inspect state

### Day 3 (Apr 15) — CampaignManager + FundingVault complete
- **Person 3**: checkAndUpdateStatus(), updateRaisedAmount(), getCampaign()
- **Person 4**: releaseFunds(), issueRefund(), getContributors()
- Test: create campaign, deposit ETH, read vault state

### Day 4 (Apr 16) — StartupFund orchestrator + full end-to-end
- **Person 5**: `StartupFund.sol` — constructor, createCampaign(), fundCampaign(), withdraw(), claimRefund()
- All 5: deploy full system in order, run full flow:
  1. Register as user (AccessControl)
  2. Create campaign (StartupFund → CampaignManager)
  3. Fund campaign (StartupFund → FundingVault)
  4. Advance time past deadline (Remix VM time travel)
  5. Withdraw (StartupFund → vault.releaseFunds + rewardToken.mint)
  6. Verify: ETH moved, tokens visible in MetaMask

### Day 5 (Apr 17) — Frontend Integration (parallel)
| Person | Task | File |
|--------|------|------|
| P1 | MetaMask wallet hook (real window.ethereum) | `src/hooks/useWallet.ts` |
| P2 | CreateCampaignForm → StartupFund.createCampaign() | `src/pages/CreateCampaign.tsx` |
| P3 | FundCampaignForm → StartupFund.fundCampaign() | `src/pages/CampaignDetail.tsx` |
| P4 | WithdrawForm + RefundRequestForm → withdraw()/claimRefund() | `src/pages/Dashboard.tsx` |
| P5 | Replace mockData: read campaigns from CampaignManager | `src/data/index.ts` → contract reads |

### Day 6 (Apr 18) — Connect + Final Polish
- Merge all integration pieces
- End-to-end browser test: full campaign lifecycle
- Prepare zip + setup guide for submission

---

## Deployment Sequence (Remix IDE)

```
1. In Remix: Environment → "External Http Provider" → http://127.0.0.1:7545
2. Deploy RewardToken.sol          → save address (RT_ADDR)
3. Deploy AccessControl.sol        → save address (AC_ADDR)
4. Deploy CampaignManager.sol      → save address (CM_ADDR)
5. Deploy FundingVault.sol         → save address (FV_ADDR)
6. Deploy StartupFund.sol(CM_ADDR, FV_ADDR, RT_ADDR, AC_ADDR) → save (SF_ADDR)

Post-deploy authorization:
7. rewardToken.setMinter(SF_ADDR)
8. campaignManager.setAuthorized(SF_ADDR)
9. fundingVault.setAuthorized(SF_ADDR)

Save all addresses to: src/lib/contractAddresses.ts
```

---

## Frontend Integration Points

| Form | Contract | Function | Notes |
|------|----------|----------|-------|
| Register button | AccessControl | `register()` | Before any action |
| CreateCampaignForm | StartupFund | `createCampaign(...)` | Deadline: convert date → Unix timestamp |
| FundCampaignForm | StartupFund | `fundCampaign(id)` payable | `{value: ethers.parseEther(amount)}` |
| WithdrawForm | StartupFund | `withdraw(id)` | Creator only |
| RefundRequestForm | StartupFund | `claimRefund(id)` | After deadline, goal not met |
| RewardTokenForm (display) | RewardToken | `balanceOf(address)` | Read-only |

**Campaign list read**: Loop `campaignManager.campaignCount` → call `campaignManager.campaigns(i)` for each.

---

## Known Deviations from Assignment

| Assignment Says | We Do | Reason |
|----------------|-------|--------|
| Truffle for compile/deploy | Remix IDE | Simpler for team learning |
| IPFS for file storage | Store URL string in imageUrl | IPFS setup complexity vs 6-day deadline |
| "Emergency pause mechanisms" | `pause()`/`unpause()` in AccessControl | Implemented — matches use case diagram |

---

## Known Limitations

1. `withdraw()` loops all contributors for token minting — gas concern on mainnet, fine for Ganache.
2. No on-chain file storage — imageUrl is a string (URL or IPFS hash).
3. Campaign cancellation by creator is off-chain (email platform) — contract only handles deadline-based cancellation.
4. No NFT option — uses ERC-20 tokens only. Assignment says "Reward tokens or NFTs" — ERC-20 satisfies requirement.
