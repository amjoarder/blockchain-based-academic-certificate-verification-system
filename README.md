# VeriCred Academic Registry - Blockchain Certificate Verification

VeriCred Academic Registry is a local, zero-cost DApp built for MSc Blockchain Technology and Application Assignment 2. An administrator authorizes universities; an authorized university registers students, stores certificate proofs, and revokes records; any verifier can check an ID or compare a PDF's exact SHA-256 digest with the blockchain record.

This is a coursework prototype. It is not an official university service and its demonstration records are not legal credentials.

## What it demonstrates

- Solidity-enforced administrator, university, and public-verifier roles.
- Immutable certificate records with permanent, auditable revocation status.
- Local browser hashing; certificate files are not uploaded.
- Valid, revoked, tampered, and not-found verification outcomes.
- QR links that open a live verification route.
- Administrator, university, public verification, and performance dashboards.
- Receipt-derived gas/fee data and measured multi-volume scalability results.

Blockchain proves who recorded a claim, whether the file matches that record, and whether it was revoked. It does not independently prove that issuer-entered facts were truthful.

## Architecture and technology

React 19 + Vite 8 -> ethers 6 -> wallet/read-only JSON-RPC -> Hardhat 3 local EVM -> Solidity 0.8.28.

There is no backend or database. Contract state is authoritative. The browser computes SHA-256 over PDF bytes—using Web Crypto when available and a local ethers fallback on LAN HTTP—and sends only the 32-byte digest during issuance.

## Repository structure

```text
blockchain/   Solidity contract, tests, deploy/seed/smoke/benchmark scripts
frontend/     React DApp, contract service, pages, components, unit tests
results/      Current benchmark summary required by the performance dashboard
docs/         Essential architecture, contract, performance, demo, and troubleshooting guides
scripts/      Path-safe Vite/Vitest runner for this assignment folder
```

## Prerequisites

- Node.js 24 or newer.
- pnpm 11 (`corepack enable` and `corepack prepare pnpm@11.19.0 --activate` if pnpm is unavailable).
- A MetaMask-compatible browser wallet for state-changing UI actions.
- Python 3 only for dependency-free SVG chart generation.

All JavaScript versions are pinned in the lock file. No global Hardhat or Vite install is required.

## Fastest local demonstration

```powershell
pnpm setup
pnpm demo
```

Open `http://localhost:5173` for same-computer use. To create a QR that a phone can scan, open the terminal's **Network** URL on the computer instead, for example `http://192.168.0.184:5173`. `pnpm demo` starts the chain, deploys a fresh contract, seeds demonstration data, updates the frontend ABI/address automatically, and starts the UI. Stop both processes with `Ctrl+C`.

The source path contains `#`, which Vite normally interprets as a URL fragment. `scripts/run-frontend-tool.mjs` automatically maps the workspace to a temporary path-safe drive while Vite/Vitest runs; no manual path change is needed.

## Common commands

```powershell
pnpm setup          # install and compile
pnpm demo           # chain + deploy + seed + frontend
pnpm test           # contract, metric, and frontend tests
pnpm smoke          # isolated end-to-end four-status contract workflow
pnpm benchmark      # fresh benchmark + CSV + SVG charts
pnpm build          # production frontend build
pnpm reset          # deploy and seed a new clean app contract on a running node
```

For separate terminals: run `pnpm chain`, then `pnpm deploy:local`, `pnpm seed`, and `pnpm frontend`.

## Wallet network and roles

Add the local network in MetaMask: RPC `http://127.0.0.1:8545`, chain ID `31337`, currency `ETH`. Hardhat prints 20 funded accounts when the node starts.

- Account 0: administrator/deployer, `0xf39F...2266`.
- Account 1: seeded authorized university, `0x7099...79C8`.
- Account 3: unauthorized negative-test account, `0x90F7...b906`.

Hardhat's printed private keys are public development credentials. They are unsafe on any public network. Never send real assets to them.

## Verification and QR workflow

The seeded ID is `CERT-2026-001`. Visiting `/verify/CERT-2026-001` performs a fresh read. Selecting a PDF additionally compares its locally calculated SHA-256 digest. University-issued QR codes contain only that route; they do not cache or assert validity. For phone scanning, keep the phone and computer on the same trusted Wi-Fi and open VeriCred through Vite's **Network** URL before issuing the certificate. The QR then contains the computer's LAN address. Public reads go through Vite's `/rpc` proxy to the loopback-only Hardhat node, so port 8545 is not exposed to the LAN. Allow Node.js through Windows Firewall for **Private networks** if prompted.

## Benchmark evidence

`pnpm benchmark` uses fresh contract instances, never the normal demo contract. It writes timestamped raw receipts to `results/raw`, current summaries to `results/summary`, report-ready CSV files to `results/csv`, and SVG plots to `results/charts`. The UI imports the current real summary at build time. Local Hardhat figures are development-machine measurements, not public-network capacity claims.

## Security notes

- Authorization lives in Solidity; hiding a button is never considered enforcement.
- Duplicate IDs, zero addresses/hashes, wrong-university issuance, cross-issuer revocation, and double revocation revert.
- Certificate PDFs remain off-chain and on the verifier's device.
- Student names and identifiers in this prototype are visible on-chain; use pseudonymous identifiers or privacy-preserving designs for production.
- Records are append-only; revocation changes status instead of deleting history.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Smart contract guide](docs/SMART_CONTRACT_GUIDE.md)
- [Performance guide](docs/PERFORMANCE_GUIDE.md)
- [Demonstration guide](docs/DEMO_GUIDE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
