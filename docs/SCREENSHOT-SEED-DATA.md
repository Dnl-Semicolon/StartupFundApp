# Screenshot Seed Data — Copy-Paste Campaign Field Values

Two ways to populate the UI with rich data for report screenshots:

## A. Pre-seeded mock campaigns (automatic)

Already live on the `demo/route-a-hardcode` branch. Load `/campaigns` and you'll see these in the grid alongside any on-chain campaigns you've created:

| ID | Title | Status | Screenshot Value |
|----|-------|--------|------------------|
| `c1` | EcoFlow: Decentralized Smart Grid | ACTIVE | Mid-progress (69%) |
| `c2` | NeuralBridge: AI Mind Interface | FUNDED | Over-goal |
| `c3` | ChainSafe: Institutional Custody | ACTIVE | Low raised (14%) |
| `c4` | BioPulse: Real-time Health Diagnostics | ACTIVE | 95% near-goal |
| `pending-1` | QuantumLedger Protocol | PENDING | Voting panel surfaces |
| `c5` | OrbitLens: Satellite Imagery AI | FUNDED | **Disburse Profits demo (3 contributors)** |
| `c6` | Relic: On-Chain Archaeology Registry | CANCELLED | **Refund path demo (2 contributors)** |
| `c7` | ShillChain: Influencer Crypto Launchpad | REJECTED | Community voted down |
| `c8` | GreenLoop: Circular Packaging Fund | FUNDED (overdue) | **Reclaim banner demo (4 contributors)** |

No action needed — these load on every `/campaigns` visit.

---

## B. Copy-paste into `/create` for real-chain variety

Create these via the actual form to generate real tx hashes + Ganache blocks for screenshots that need to show MetaMask signing + on-chain state. Each block is ready to paste field-by-field.

---

### Campaign 1: TurbineFlow Wind Array (ACTIVE, short deadline — great for fund flow demo)

```
Title:              TurbineFlow Community Wind Array
Category:           Green Energy
Short Description:  Community-owned micro-wind network supplying local grids with storm-buffered baseload power.
Description:        TurbineFlow is deploying a fleet of residential-scale vertical-axis wind turbines tuned for coastal storm cycles. Each unit is community-funded, grid-connected, and profit-shares back to its 12 local investors. Our phase-one funding covers 20 turbines across three pilot villages, a shared inverter farm, and 12 months of maintenance. Targeting 40% renewable displacement within the pilot zones by year two. Manufacturing partner lined up. Permits in hand. We just need the capital to break ground.
Goal Amount (ETH):  3
Min Contribution:   0.01
Deadline:           [pick 2 hours from now]
Token Symbol:       WIND
Tags:               renewable, wind, community, infrastructure, storm
Profit Return %:    12
Return By:          [pick 90 days from now]
Image URL:          https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=1200&auto=format&fit=crop&q=80
```

---

### Campaign 2: PharmaChain Cold-Storage Proof (ACTIVE, long deadline, fintech adjacent)

```
Title:              PharmaChain Cold-Storage Proof
Category:           Healthcare
Short Description:  IoT-anchored temperature attestation for vaccine shipments, end-to-end auditable on-chain.
Description:        PharmaChain attaches a cryptographic heartbeat to every vaccine shipment via tamper-resistant IoT sensors that publish temperature + GPS proofs to Ethereum every 60 seconds. Receiving hospitals get a one-click audit trail; insurance claims for spoiled shipments drop from weeks to minutes. Our launch partner is a mid-size regional distributor moving 400k units/month, with two more in pipeline. Funding covers the first 5,000 sensor units, backend infrastructure, and an 8-month operational runway for the engineering team.
Goal Amount (ETH):  5
Min Contribution:   0.05
Deadline:           [pick 30 days from now]
Token Symbol:       COLD
Tags:               healthcare, iot, supply-chain, attestation
Profit Return %:    9
Return By:          [pick 365 days from now]
Image URL:          https://images.unsplash.com/photo-1584362917165-526a968579e8?w=1200&auto=format&fit=crop&q=80
```

---

### Campaign 3: KernelForge Open-Source Compiler (Tech, modest goal — easy to fund to 100%)

```
Title:              KernelForge Open-Source Compiler
Category:           Tech
Short Description:  WASM-native compiler toolchain prioritising deterministic builds and reproducible artifacts.
Description:        KernelForge is building a compiler infrastructure targeting deterministic WASM output for supply-chain-critical software. Every byte of every artifact is reproducible bit-for-bit, enabling trustless verification of deployed binaries against their source code — a hard requirement for post-Solarwinds software bills-of-materials. We ship the reference implementation, a verification service, and a growing library of audited toolchain components. Funding covers a full-time compiler engineer plus two contractor audits from established firms.
Goal Amount (ETH):  1.5
Min Contribution:   0.02
Deadline:           [pick 14 days from now]
Token Symbol:       FORGE
Tags:               compiler, wasm, reproducible, supply-chain, oss
Profit Return %:    15
Return By:          [pick 180 days from now]
Image URL:          https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&auto=format&fit=crop&q=80
```

---

### Campaign 4: Mesh Credit Union (Fintech, high-goal — stays partial)

```
Title:              Mesh Credit Union On-Chain
Category:           Fintech
Short Description:  Member-governed lending collective using programmable debt instruments instead of custodial banks.
Description:        Mesh lets a closed circle of 50-200 members pool deposits and issue programmable, collateralised loans between each other — without touching a custodial bank. All debt instruments are on-chain ERC-20 claims; membership is token-gated via a social-graph attestation contract. Interest rates are voted by the pool every epoch. We've had three community-scale pilots (total 120 members, $340k pooled off-chain) and want to launch the first production on-chain pool. Funding covers the audited core contracts, the governance portal, and a 6-month member onboarding push.
Goal Amount (ETH):  10
Min Contribution:   0.1
Deadline:           [pick 45 days from now]
Token Symbol:       MESH
Tags:               fintech, lending, cooperative, governance, social-graph
Profit Return %:    7
Return By:          [pick 730 days from now]
Image URL:          https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=1200&auto=format&fit=crop&q=80
```

---

### Campaign 5: Post-Mortem (Web3, clearly niche — could get voted down)

```
Title:              Post-Mortem: Decentralized Breakup Advice
Category:           Web3
Short Description:  Anonymous group-chat therapy for crypto-failed relationships, stored on IPFS forever.
Description:        Post-Mortem is a decentralised peer-support forum for people who lost partners to bad crypto trades. Every session is pseudonymous, encrypted, and pinned on IPFS as a permanent memorial to the stablecoin that shouldn't have been. Our monetisation: $5/month subscription in USDC, half to therapists (verified via on-chain license NFTs) and half to the pool for crisis-grant payouts. Looking for funding to pilot with a network of 30 vetted therapists over 90 days.
Goal Amount (ETH):  2
Min Contribution:   0.01
Deadline:           [pick 21 days from now]
Token Symbol:       PM
Tags:               mental-health, web3, community, ipfs
Profit Return %:    5
Return By:          [pick 365 days from now]
Image URL:          https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=1200&auto=format&fit=crop&q=80
```

---

## Screenshot tour sequence

1. **`/` (Home)** — hero + FeaturedSection with live stats.
2. **`/campaigns`** — grid mixing chain + mocks. Spotlight row up top, then 9+ campaign cards covering every status.
3. **Type "ai" in SearchBar** — Fuse dropdown shows NeuralBridge + OrbitLens via tag hit.
4. **`/campaigns/pending-1`** — VotingPanel with Approve/Disapprove + demo-skip ghost button.
5. **`/campaigns/c5`** (switch MetaMask to account `0xAlexRivera` — creator) — Withdraw + **Disburse Profits form** with 3-row contributor table.
6. **`/campaigns/c6`** — Refund banner for contributors.
7. **`/campaigns/c7`** — REJECTED terminal banner.
8. **`/campaigns/c8`** — **Overdue Reclaim banner** (if you're connected as one of the Hardhat contributor addresses, or just screenshot from a creator's POV — banner visible on the detail page regardless of wallet).
9. **`/create`** — datetime-local picker + all fields + profit-return fields.
10. **`/dashboard`** — charts + refunds tab.
11. **`/faq`, `/privacy`, `/terms`, `/cookies`, `/network`** — static pages + footer nav.

## Real-chain money-shot demo

For screenshots of real MetaMask balance deltas + Ganache tx log:

1. Create campaign from Campaign 1 template above with deadline **2 hours out**.
2. Use **demo fast-forward** to skip voting → campaign ACTIVE.
3. Fund from Account 2 + Account 3 until goal met → FUNDED.
4. Back as creator, click **Disburse Profits** → 2 sequential MetaMask popups, each tx lands in Ganache block log, wallet balances of Account 2 and Account 3 increase by +12% each.

Screenshot:
- Ganache "Transactions" tab with N new blocks
- MetaMask "Activity" tab for Account 2 and Account 3 showing "Received X ETH" rows
- The "Profits Disbursed" banner on CampaignDetail
