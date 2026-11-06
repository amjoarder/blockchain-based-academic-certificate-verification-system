import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const deploymentPath = resolve(projectRoot, "frontend", "src", "contracts", "deployment.json");
export const key = (ethers, value) => ethers.keccak256(ethers.toUtf8Bytes(value.trim().replace(/\s+/g, " ").toUpperCase()));

export async function readDeployment() {
  return JSON.parse(await readFile(deploymentPath, "utf8"));
}
