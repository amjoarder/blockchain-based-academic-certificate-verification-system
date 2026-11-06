# Demonstration Guide

## Start

```powershell
pnpm setup
pnpm demo
```

Open `http://localhost:5173` for same-computer use. For a phone-scannable QR, open the terminal's **Network** URL on the computer before issuing. Keep MetaMask configured with RPC `http://127.0.0.1:8545`, chain ID `31337`. Import only public local development keys printed by Hardhat; never reuse them elsewhere.

## Roles

- Account 0 is administrator.
- Account 1 is the seeded authorized university.
- Account 3 is useful for unauthorized-call demonstrations.
- A student wallet is not required; students are institutional records in this design.

## Reliable presentation flow

1. Landing: explain the problem, local file hashing, and the trust caveat.
2. Administrator: connect Account 0. Show counts and the seeded university. Optionally register a new unused Hardhat address.
3. University: switch MetaMask to Account 1. Register a new student ID.
4. Prepare any clearly labeled demonstration PDF. Issue it with a new certificate ID, student ID, program, and date. Confirm the wallet transaction.
5. Show the generated QR and open its link. Verification should report valid.
6. Select the exact issued PDF; it remains valid because SHA-256 matches.
7. Modify and save a copy of the PDF, then select that copy; status becomes tampered.
8. Return to the university dashboard, connect Account 1, and revoke the credential with a clear reason.
9. Reopen verification; revoked takes precedence even if the original PDF still matches.
10. Search an unknown ID to show not found.
11. Open Performance and explain deployment gas, fees, read latency, confirmation time, TPS, success rate, and volume scaling from actual files in `results/`.

Use `CERT-2026-001` for a quick seeded record-only verification. Its seeded digest represents deterministic demo bytes rather than a provided PDF, so use a newly issued record for the file-match/tamper portion.

## QR note

The QR uses the browser's current origin. For a phone demonstration, open the Vite **Network** URL on the computer, keep both devices on the same trusted Wi-Fi, and allow Node.js on Windows **Private networks** if prompted. The phone loads the verification page and sends public reads to `/rpc`; Vite proxies those requests to Hardhat on `127.0.0.1:8545`. MetaMask and state-changing actions remain on the computer. If the network blocks device-to-device traffic, use **Open verification page** on the computer as the fallback.
