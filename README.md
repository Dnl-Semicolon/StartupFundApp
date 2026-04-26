# StartupFund — Frontend

React + Vite + TypeScript UI for the StartupFund decentralised crowdfunding dApp.

## Prerequisites

- Node.js 20+ (LTS)
- npm 10+
- Chrome / Edge / Brave with MetaMask installed
- Ganache desktop app running the companion contracts (see `../StartupFund/README.md`)

## Expected directory tree after unzip

Unzip into any folder, then step inside one level (do not run from inside a nested duplicate). You should see:

```
StartupFundApp/
├── public/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   └── pages/
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── components.json
├── eslint.config.js
└── README.md
```

If you see `__MACOSX/` or `.DS_Store` files (common after unzip on Windows), delete them:

```
rmdir /s /q __MACOSX
del /s /q .DS_Store
```

## Install

```
npm install
```

First install takes 1–2 minutes depending on connection.

## Run the dev server

```
npm run dev
```

Open the URL printed (normally `http://localhost:8080`, falls back to `8081` if the port is busy).

## Build (optional)

```
npm run build
npm run preview
```

## Connect to the deployed contracts

After the contracts are deployed (see the contracts repo README), paste the six addresses that Remix prints at the end of the deploy script into `src/lib/contractAddresses.ts`:

```ts
export const CONTRACT_ADDRESSES = {
  startupFund:     "0x...",
  campaignManager: "0x...",
  fundingVault:    "0x...",
  rewardToken:     "0x...",
  accessControl:   "0x...",
  campaignVoting:  "0x...",
};

export const CHAIN_ID = 1337;
```

Save — Vite hot-reloads and the UI reads live chain state.

## Routes

| Path | Purpose |
|---|---|
| `/` | Home — featured campaigns + platform stats |
| `/campaigns` | Discover — full grid with search + category filters |
| `/campaigns/:id` | Campaign detail — fund / withdraw / refund / vote / disburse |
| `/create` | Launch a new campaign |
| `/campaigns/:id/edit` | Edit (creator only, before first contribution) |
| `/dashboard` | Your activity — created + contributed + refund-eligible |
| `/about`, `/faq`, `/terms`, `/privacy`, `/cookies`, `/network` | Static + diagnostic |

## Stack

React 18 · Vite 7 · TypeScript · Tailwind v4 · shadcn/ui · Framer Motion · ethers.js v6 · Fuse.js · React Hook Form · Zod · Zustand · TanStack Query

## Scripts

```
npm run dev        Start dev server at http://localhost:8080
npm run build      Production build to /dist
npm run preview    Serve /dist locally
npm run lint       ESLint
npx tsc --noEmit -p tsconfig.app.json --strict       Type-check
```
