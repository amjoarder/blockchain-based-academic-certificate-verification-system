import { artifacts, network } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const { ethers, networkName } = await network.create();
const [deployer] = await ethers.getSigners();
const contract = await ethers.deployContract("AcademicCertificateVerification");
const receipt = await contract.deploymentTransaction().wait();
const artifact = await artifacts.readArtifact("AcademicCertificateVerification");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const outputPath = resolve(root, "frontend", "src", "contracts", "deployment.json");
const deployment = {
  network: networkName,
  chainId: Number((await ethers.provider.getNetwork()).chainId),
  address: await contract.getAddress(),
  deployer: deployer.address,
  deployBlock: receipt.blockNumber,
  deploymentTransactionHash: receipt.hash,
  deploymentGasUsed: receipt.gasUsed.toString(),
  deployedAt: new Date().toISOString(),
  abi: artifact.abi
};
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(deployment, null, 2)}\n`, "utf8");
console.log(JSON.stringify(deployment, null, 2));
