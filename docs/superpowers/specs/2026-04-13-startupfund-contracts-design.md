# StartupFund Smart Contracts — Design Spec
**Date**: 2026-04-13  
**Deadline**: 2026-04-19 (6 days)  
**Team**: 5 members  
**Platform**: Ethereum (Ganache local, Chain ID 1337), Remix IDE  

---

## Context

The StartupFund frontend (React + TypeScript at `/Users/danieltan/blockchain crowdfunding platform (1)`) is ~95% complete using mocked data. The blockchain layer is 0% — no smart contracts, no MetaMask integration, no ethers.js wiring.

This spec covers the full blockchain layer: two Solidity contracts + 6-day integration plan.

**Goal**: Deploy two contracts to Ganache, wire all 5 frontend forms to real contract calls, replace mock data with on-chain reads.

---

## Architecture

Two contracts. Option B selected (not factory pattern — too complex for beginners in 6 days).

```
RewardToken.sol          ← ERC-20 token. Mintable only by StartupFund.
StartupFund.sol          ← All campaign logic. Holds ETH. Calls RewardToken.mint().
```

Deploy order:
1. Deploy `RewardToken.sol` → get address
2. Deploy `StartupFund.sol` → pass RewardToken address to constructor
3. `RewardToken.setMinter(startupFundAddress)` ← authorize StartupFund to mint

---

## RewardToken.sol

Simple OpenZeppelin ERC-20 with a single minter role.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

**Estimated size**: ~25 lines. **Assignable to**: 1 team member (Day 1).

---

## StartupFund.sol

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
    string imageUrl;
    string category;
    uint256 goalAmount;         // in wei
    uint256 raisedAmount;       // in wei
    uint256 minContribution;    // in wei (default: 1e15 = 0.001 ETH)
    uint256 deadline;           // Unix timestamp
    CampaignStatus status;
    string tokenSymbol;         // cosmetic label e.g. "EFLOW"
    uint256 backersCount;
    Milestone[] milestones;
}
```

### State Variables

```solidity
mapping(uint256 => Campaign) public campaigns;

// campaignId → contributor address → total contributed (wei)
mapping(uint256 => mapping(address => uint256)) public contributions;

// contributor arrays for token minting loop in withdraw()
mapping(uint256 => address[]) public contributorList;

// campaignId → contributor → refund claimed?
mapping(uint256 => mapping(address => bool)) public refundClaimed;

// campaignId → whether funds have been withdrawn
mapping(uint256 => bool) public withdrawn;

uint256 public campaignCount;
RewardToken public rewardToken;
```

### Events

```solidity
event CampaignCreated(uint256 indexed campaignId, address creator, uint256 goalAmount, uint256 deadline);
event FundingReceived(uint256 indexed campaignId, address contributor, uint256 amount);
event CampaignFunded(uint256 indexed campaignId, uint256 totalRaised);
event CampaignCancelled(uint256 indexed campaignId);
event FundsWithdrawn(uint256 indexed campaignId, address creator, uint256 amount);
event RefundClaimed(uint256 indexed campaignId, address contributor, uint256 amount);
event TokensMinted(uint256 indexed campaignId, address contributor, uint256 tokens);
```

### Functions

#### `createCampaign()`
```
Inputs: title, slug, description, shortDescription, imageUrl, category,
        goalAmount (wei), minContribution (wei), deadline (unix timestamp),
        tokenSymbol, milestones array

Validation:
  - goalAmount > 0
  - deadline > block.timestamp
  - deadline <= block.timestamp + 60 days
  - deadline >= block.timestamp + 1 day

Effect:
  - Stores campaign in campaigns[campaignCount++]
  - Emits CampaignCreated
```

#### `fundCampaign(campaignId)` — payable
```
Validation:
  - Campaign exists
  - status == ACTIVE
  - block.timestamp < deadline
  - msg.value >= minContribution

Effect:
  - contributions[campaignId][msg.sender] += msg.value
  - campaign.raisedAmount += msg.value
  - If new contributor (contributions[campaignId][msg.sender] == 0 BEFORE this tx):
      contributorList[campaignId].push(msg.sender), backersCount++
  - If raisedAmount >= goalAmount: status = FUNDED, emit CampaignFunded
  - Emits FundingReceived
```

#### `checkStatus(campaignId)` — public, anyone can call
```
Effect:
  - If deadline passed AND status == ACTIVE:
    - If raisedAmount >= goalAmount: status = FUNDED
    - Else: status = CANCELLED
```

#### `withdraw(campaignId)` — reentrancy protected
```
Validation:
  - msg.sender == campaign.creator
  - status == FUNDED (or call checkStatus first)
  - withdrawn[campaignId] == false

Effect:
  1. Loop contributorList[campaignId]:
     - mint tokens: rewardToken.mint(contributor, contributions[campaignId][contributor])
     - emit TokensMinted
  2. Mark withdrawn[campaignId] = true
  3. Transfer campaign.raisedAmount to msg.sender
  4. Emit FundsWithdrawn

Reentrancy guard: use ReentrancyGuard from OpenZeppelin OR
  set withdrawn[campaignId] = true BEFORE the ETH transfer (CEI pattern).
```

#### `claimRefund(campaignId)` — reentrancy protected
```
Validation:
  - status == CANCELLED (or call checkStatus first)
  - contributions[campaignId][msg.sender] > 0
  - refundClaimed[campaignId][msg.sender] == false

Effect:
  1. amount = contributions[campaignId][msg.sender]
  2. refundClaimed[campaignId][msg.sender] = true   ← BEFORE transfer (CEI)
  3. contributions[campaignId][msg.sender] = 0
  4. Transfer amount to msg.sender
  5. Emit RefundClaimed
```

### Security Patterns

**CEI (Checks-Effects-Interactions)**: Always update state BEFORE sending ETH. This prevents reentrancy without a modifier. Applied in both `withdraw()` and `claimRefund()`.

Optionally also import `@openzeppelin/contracts/utils/ReentrancyGuard.sol` and inherit it for belt-and-suspenders protection.

---

## 6-Day Sprint Plan

### Day 1 (Apr 13) — RewardToken.sol
- All 5 read and understand the contract together
- Person 1 writes it (~25 lines) in Remix
- Import OpenZeppelin: `import "@openzeppelin/contracts/token/ERC20/ERC20.sol";`
- Deploy to Ganache in Remix, call `mint()`, verify balance in MetaMask

### Day 2 (Apr 14) — StartupFund.sol: Data + createCampaign
- All 5 together: understand struct, mappings, events
- Write Campaign struct, state variables, all events
- Write `createCampaign()` function
- Deploy to Ganache, call `createCampaign()`, read `campaigns[0]`

### Day 3 (Apr 15) — StartupFund.sol: fundCampaign + checkStatus
- Write `fundCampaign()` payable function
- Write `checkStatus()` helper
- Deploy fresh, fund a campaign from 2 Ganache accounts
- Verify contributions mapping, raisedAmount, status transition

### Day 4 (Apr 16) — StartupFund.sol: withdraw + claimRefund
- Write `withdraw()` — link to RewardToken.mint()
- Write `claimRefund()`
- Full end-to-end: create → fund → pass deadline → withdraw/refund
- Verify tokens appear in MetaMask, ETH balances correct

### Day 5 (Apr 17) — Frontend Integration (parallel)
| Person | Task | File |
|--------|------|------|
| P1 | MetaMask wallet hook | `src/hooks/useWallet.ts` |
| P2 | CreateCampaignForm wiring | `src/components/Forms.tsx` + `src/pages/CreateCampaign.tsx` |
| P3 | FundCampaignForm wiring | `src/components/Forms.tsx` + `src/pages/CampaignDetail.tsx` |
| P4 | WithdrawForm + RefundRequestForm | `src/components/Forms.tsx` + `src/pages/Dashboard.tsx` |
| P5 | Replace mock data with contract reads | `src/data/index.ts` + campaign list/detail pages |

### Day 6 (Apr 18) — Connect + Final Polish
- Merge all integration branches
- End-to-end test: create campaign → fund → withdraw/refund → tokens visible
- Prepare submission package (zip source, setup guide)

---

## Deployment Sequence (Remix)

1. Open Remix IDE at `http://localhost:8080` (or `https://remix.ethereum.org`)
2. Connect Remix to Ganache: Environment → "External Http Provider" → `http://127.0.0.1:7545`
3. Deploy `RewardToken.sol` → copy address (e.g. `0xABC...`)
4. Deploy `StartupFund.sol` with constructor arg `_rewardToken = 0xABC...`
5. Call `rewardToken.setMinter(startupFundAddress)`
6. Save both addresses to `src/lib/contractAddresses.ts` for frontend use

---

## Frontend Integration Points

Each form maps to one contract function:

| Form | Contract Function | Ethers.js Call |
|------|-----------------|----------------|
| CreateCampaignForm | `createCampaign(...)` | `contract.createCampaign(...)` |
| FundCampaignForm | `fundCampaign(id)` | `contract.fundCampaign(id, {value: ethers.parseEther(amount)})` |
| WithdrawForm | `withdraw(id)` | `contract.withdraw(id)` |
| RefundRequestForm | `claimRefund(id)` | `contract.claimRefund(id)` |
| RewardTokenForm | (tokens auto-minted on withdraw) | Read `rewardToken.balanceOf(address)` |

---

## Known Limitations (for documentation)

1. `withdraw()` loops all contributors — gas limit concern on mainnet with 1000+ backers. Acceptable for Ganache/assignment scope.
2. All campaign metadata stored on-chain — expensive in production. Acceptable for assignment.
3. Token symbol ("SFT") is shared across all campaigns — per-campaign symbols are cosmetic strings stored in Campaign struct, not actual ERC-20 symbols.
4. No Pausable/emergency stop implemented (assignment mentions it but not in core requirements).
5. No campaign cancellation by creator (assignment says creator must email platform — off-chain process).
