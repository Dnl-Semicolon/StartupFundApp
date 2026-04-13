# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:8080
npm run build      # Production build
npm run lint       # ESLint
npx tsc --noEmit -p tsconfig.app.json --strict  # Type check
```

## Project Overview

**StartupFund** — a decentralized crowdfunding dApp (BMIS2003 assignment) built on Ethereum. The frontend UI is complete but uses entirely mocked data. The blockchain layer (smart contracts + MetaMask integration) has not been built yet.

Stack: React 18 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui + Framer Motion + React Router v6 + React Query + Zustand

## Architecture

### Path alias
`@/` maps to `./src/` — use this for all imports.

### What is template code vs. custom code
- `src/components/ui/` — shadcn/ui component library. Don't modify these.
- `src/pages/home/`, `src/api/demo.ts`, `src/lib/react-router-dom-proxy.tsx` — Skywork/Lovable template scaffolding. Not used by the app.
- Everything else in `src/` is custom application code for StartupFund.

### Data model
All types are defined in `src/lib/index.ts`: `Campaign`, `User`, `Contribution`, `Milestone`, `CAMPAIGN_STATUS`. Route paths are also exported from there as `ROUTE_PATHS`.

### Current data flow (mocked)
All campaign, user, and transaction data is hardcoded in `src/data/index.ts` (`mockCampaigns`, `mockUsers`, `mockTransactions`). These arrays need to be replaced with on-chain reads once contracts are deployed.

### Wallet (simulated)
`src/hooks/useWallet.ts` is a fully simulated wallet — it returns a hardcoded address and fake balance with a setTimeout delay. It needs to be replaced with real MetaMask (`window.ethereum`) integration using ethers.js.

### Forms → contract calls
All five forms in `src/components/Forms.tsx` (`CreateCampaignForm`, `FundCampaignForm`, `WithdrawForm`, `RefundRequestForm`, `RewardTokenForm`) currently `console.log()` on submit. Each maps to a smart contract function that needs to be wired up with ethers.js.

## What Still Needs Building

1. **`StartupFund.sol`** — campaign creation, ETH funding, withdrawal (creator only, after goal met), refunds (contributors, if goal not met by deadline), ERC-20 reward token minting
2. **`RewardToken.sol`** — ERC-20 token, 1 token = 1 ETH contributed, minted automatically on campaign success
3. **Real MetaMask integration** — replace `src/hooks/useWallet.ts` with `window.ethereum` provider
4. **ethers.js contract calls** — replace all `console.log()` in Forms.tsx and mock data reads with actual contract interactions
5. **Deploy target** — Ganache local blockchain (RPC: `http://127.0.0.1:7545`, Chain ID: 1337) via Remix IDE

## Business Rules (from assignment spec)

Key rules the smart contracts must enforce:
- Campaign duration: 1–60 days; goal must be > 0
- Contributions: only while ACTIVE + before deadline; min 0.001 ETH; locked until settlement
- Success: if `raisedAmount >= goalAmount` before deadline → creator can withdraw full amount once
- Failure: if goal not met by deadline → contributors can claim full refund once
- Reward tokens: minted 1:1 with ETH contributed, only on success, must complete before withdrawal
- Refunded contributors cannot receive reward tokens
- Reentrancy protection required on all ETH transfer functions

## Supabase

`@supabase/supabase-js` is in `package.json` but is **not used anywhere**. No client is initialized, no queries exist. The blockchain is the database for this project — ignore Supabase entirely.

## Vite Config Notes

`vite.config.ts` contains a `cdnPrefixImages()` plugin (rewrites image paths to a CDN URL at build time) and the `lovable-tagger` dev plugin — both are platform features, not application logic.
