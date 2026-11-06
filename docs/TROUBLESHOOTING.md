# Troubleshooting

- **`pnpm` not found:** enable Corepack, then activate pnpm 11.19.0.
- **Port 8545 in use:** stop the earlier Hardhat node or use that node and run `pnpm reset`.
- **Port 5173 in use:** stop the earlier Vite process; Vite may otherwise choose a different port.
- **MetaMask wrong network:** select Hardhat Local, RPC `127.0.0.1:8545`, chain ID `31337`.
- **MetaMask missing:** public verification still works; state-changing dashboards need a compatible injected wallet.
- **RPC unavailable:** start `pnpm chain`, then deploy and seed or use `pnpm demo`.
- **Stale address / chain reset:** run `pnpm reset`; deployment rewrites the frontend config. Restart/reload Vite if necessary.
- **Unauthorized role:** Account 0 is admin and Account 1 is the seeded university after `pnpm demo`.
- **Duplicate certificate/student:** choose a new ID; IDs are immutable and globally unique.
- **Rejected wallet request:** retry and approve the transaction in MetaMask.
- **Dependency corruption:** move/delete only this project's `node_modules`, then run `pnpm install`.
- **Vite warns about `#` in path:** always use the provided pnpm scripts. The path-safe runner handles it automatically.
- **Frontend cannot read results:** run `pnpm benchmark`, then restart the dev server because JSON is imported at build time.
- **Local blockchain reset lost state:** expected; the local chain is ephemeral. `pnpm demo` redeploys and reseeds.
- **Phone QR contains localhost:** reopen VeriCred on the computer using the terminal's **Network** URL before issuing the certificate.
- **Phone cannot open the Network URL:** put both devices on the same trusted Wi-Fi, disable guest/client isolation, and allow Node.js through Windows Firewall on **Private networks** only.
- **Verification page opens but cannot read the certificate:** confirm `pnpm demo` is still running. The phone calls the app's `/rpc` endpoint, which Vite proxies to the loopback Hardhat node.
