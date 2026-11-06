# Performance Evaluation Guide

## Definitions

- **Gas used:** EVM work actually consumed by a transaction.
- **Gas limit:** sender-approved maximum; unused gas is not charged.
- **Gas price:** wei paid per gas unit on the measured block.
- **Transaction fee:** `gasUsed × effective gas price`.
- **Issuance latency:** wall time from transaction submission to confirmed receipt.
- **Verification latency:** wall time for a read-only `eth_call`; it has no on-chain fee.
- **Block confirmation time:** submission-to-receipt time under Hardhat instant mining. For the issuance batch it equals the measured confirmation latency.
- **TPS:** successful confirmed issuance transactions divided by batch elapsed seconds.
- **Success rate:** successful issuance receipts divided by attempted issuances.
- **Scalability:** how latency, TPS, success, and gas change across 10, 25, 50, and 100 certificates.

## Method

`pnpm benchmark` starts on an in-process Hardhat chain. It deploys a measurement contract for operation gas, performs 100 verification calls, and deploys a fresh contract for each volume. Student setup transactions occur before the timed issuance batch. Every issuance waits for its receipt. Raw hashes, blocks, gas, prices, fees, and timings are saved before summaries and charts are derived.

## Latest measured result

Run timestamp: 2026-09-22T02:38:59.458Z. Environment: Node v24.19.0, Hardhat chain 31337.

- Deployment: 1,785,399 gas; 0.001977189908203125 local ETH.
- University registration: 114,697 gas.
- Student registration: 207,374 gas.
- Certificate issuance: 303,123 gas.
- Revocation: 81,973 gas.
- Read-only verification: 100 samples, 0.714 ms average, 0 gas.
- 10 certificates: 3.71 ms average confirmation, 265.87 TPS, 100% success, 2,723,766 total gas.
- 25 certificates: 3.08 ms, 323.14 TPS, 100%, 6,758,247 gas.
- 50 certificates: 2.71 ms, 368.02 TPS, 100%, 13,482,414 gas.
- 100 certificates: 2.57 ms, 386.99 TPS, 100%, 26,932,008 gas.

The slight per-certificate gas decline comes from storage patterns after initial entries; exact values are preserved in the raw receipts.

## Limitations

Hardhat mines immediately on one machine with no peer propagation, mempool competition, public-network congestion, or validator finality. Its TPS and latency are useful for repeatable relative testing, not claims about Ethereum mainnet or a production consortium. Local ETH fees are computed correctly but have no monetary value. Wall-clock results vary with machine load; rerun before using numbers in a final report.

## Evidence locations

- `results/raw/benchmark-*.json`: raw receipt/timing evidence.
- `results/csv/deployment.csv`, `operation-gas.csv`, `verification-latency.csv`, `scalability.csv`: report tables.
- `results/summary/current.json`: frontend/current summary.
- `results/charts/*.svg`: charts generated from `scalability.csv`.
