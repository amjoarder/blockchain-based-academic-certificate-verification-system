import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import deployment from "../contracts/deployment.json";

export const CHAIN_ID = 31337;
export const RPC_URL = "http://127.0.0.1:8545";

export function readRpcUrl(origin = globalThis.location?.origin) {
  if (!origin) return RPC_URL;
  return `${origin.replace(/\/+$/, "")}/rpc`;
}

function requireDeployment() {
  if (!deployment.address || !deployment.abi?.length) {
    throw new Error("Contract is not deployed. Run the local deployment command first.");
  }
}

export function readContract() {
  requireDeployment();
  const provider = new JsonRpcProvider(readRpcUrl(), CHAIN_ID, { staticNetwork: true });
  return { provider, contract: new Contract(deployment.address, deployment.abi, provider) };
}

export async function walletContract() {
  requireDeployment();
  if (!globalThis.ethereum) throw new Error("MetaMask or another compatible wallet is required for this action.");
  const provider = new BrowserProvider(globalThis.ethereum);
  await provider.send("eth_requestAccounts", []);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) {
    try {
      await provider.send("wallet_switchEthereumChain", [{ chainId: "0x7a69" }]);
    } catch (error) {
      if (error.code !== 4902) throw error;
      await provider.send("wallet_addEthereumChain", [{
        chainId: "0x7a69",
        chainName: "Hardhat Local",
        nativeCurrency: { name: "Local ETH", symbol: "ETH", decimals: 18 },
        rpcUrls: [RPC_URL]
      }]);
    }
  }
  const signer = await provider.getSigner();
  return { provider, signer, account: await signer.getAddress(), contract: new Contract(deployment.address, deployment.abi, signer) };
}

export async function waitForTransaction(transaction) {
  const receipt = await transaction.wait();
  return { hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() };
}

export async function fetchRecords(contract, keyMethod, recordMethod, owner) {
  const keys = owner ? await contract[keyMethod](owner, 0, 500) : await contract[keyMethod](0, 500);
  return Promise.all(keys.map((key) => contract[recordMethod](key)));
}

export function toUniversityView(address, record) {
  return { address, name: record.name, isAuthorized: record.isAuthorized, registeredAt: record.registeredAt, exists: record.exists };
}

export { deployment };
