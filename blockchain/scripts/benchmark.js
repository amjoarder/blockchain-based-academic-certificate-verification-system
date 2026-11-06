import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { network } from "hardhat";
import { calculateFeeWei, summarizeBatch } from "../lib/metrics.js";
import { key, projectRoot } from "./helpers.js";

const { ethers } = await network.create();
const [admin, university] = await ethers.getSigners();
const volumes = (process.env.BENCHMARK_VOLUMES || "10,25,50,100").split(",").map(Number).filter((value) => value > 0);
const rawTransactions = [];

async function deploy() {
  const contract = await ethers.deployContract("AcademicCertificateVerification");
  const receipt = await contract.deploymentTransaction().wait();
  return { contract, receipt };
}

function transactionRecord(operation, receipt, latencyMs) {
  const gasPrice = receipt.gasPrice ?? 0n;
  return { operation, hash: receipt.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString(), gasPriceWei: gasPrice.toString(), feeWei: calculateFeeWei(receipt.gasUsed, gasPrice).toString(), latencyMs: Number(latencyMs.toFixed(2)), success: receipt.status === 1 };
}

async function timed(transactionPromise, operation) {
  const start = performance.now();
  const transaction = await transactionPromise;
  const receipt = await transaction.wait();
  const latency = performance.now() - start;
  const row = transactionRecord(operation, receipt, latency);
  rawTransactions.push(row);
  return { receipt, latency };
}

const deploymentRun = await deploy();
const deploymentReceipt = deploymentRun.receipt;
const deploymentGasPrice = deploymentReceipt.gasPrice ?? 0n;
const operationContract = deploymentRun.contract;
const universityRegistration = await timed(operationContract.registerUniversity(university.address, "Benchmark University"), "registerUniversity");
const sampleStudentKey = key(ethers, "BENCH-STUDENT");
const studentRegistration = await timed(operationContract.connect(university).registerStudent(sampleStudentKey, "BENCH-STUDENT", "Benchmark Student"), "registerStudent");
const sampleCertificateKey = key(ethers, "BENCH-CERTIFICATE");
const issuance = await timed(operationContract.connect(university).issueCertificate(sampleCertificateKey, "BENCH-CERTIFICATE", sampleStudentKey, "Benchmark Degree", ethers.sha256(ethers.toUtf8Bytes("benchmark-document")), 1789776000), "issueCertificate");
const revocation = await timed(operationContract.connect(university).revokeCertificate(sampleCertificateKey, "Benchmark revocation"), "revokeCertificate");

const verificationSamples = [];
for (let index = 0; index < 100; index++) {
  const start = performance.now();
  await operationContract.verifyCertificate(sampleCertificateKey, ethers.ZeroHash);
  verificationSamples.push(performance.now() - start);
}

const scalability = [];
for (const volume of volumes) {
  const { contract } = await deploy();
  await (await contract.registerUniversity(university.address, `Benchmark University ${volume}`)).wait();
  for (let index = 0; index < volume; index++) {
    const studentId = `LOAD-${volume}-STUDENT-${index}`;
    await (await contract.connect(university).registerStudent(key(ethers, studentId), studentId, `Benchmark Student ${index}`)).wait();
  }
  const latenciesMs = []; const gasUsed = []; const batchStart = performance.now();
  for (let index = 0; index < volume; index++) {
    const studentId = `LOAD-${volume}-STUDENT-${index}`; const certificateId = `LOAD-${volume}-CERT-${index}`;
    try {
      const start = performance.now();
      const transaction = await contract.connect(university).issueCertificate(key(ethers, certificateId), certificateId, key(ethers, studentId), "MSc Blockchain Systems", ethers.sha256(ethers.toUtf8Bytes(`document-${volume}-${index}`)), 1789776000);
      const receipt = await transaction.wait();
      latenciesMs.push(performance.now() - start); gasUsed.push(receipt.gasUsed);
      rawTransactions.push(transactionRecord("scalabilityIssue", receipt, latenciesMs.at(-1)));
    } catch (error) { rawTransactions.push({ operation: "scalabilityIssue", volume, index, success: false, error: error.shortMessage || error.message }); }
  }
  scalability.push(summarizeBatch({ volume, latenciesMs, gasUsed, elapsedMs: performance.now() - batchStart }));
}

const avgVerification = verificationSamples.reduce((a,b)=>a+b,0)/verificationSamples.length;
const feeWei = calculateFeeWei(deploymentReceipt.gasUsed, deploymentGasPrice);
const summary = {
  completed: true,
  generatedAt: new Date().toISOString(),
  environment: { network: "Hardhat in-process EVM", chainId: Number((await ethers.provider.getNetwork()).chainId), node: process.version, volumes },
  deployment: { gasUsed: deploymentReceipt.gasUsed.toString(), gasPriceWei: deploymentGasPrice.toString(), feeWei: feeWei.toString(), feeEth: ethers.formatEther(feeWei), blockNumber: deploymentReceipt.blockNumber, transactionHash: deploymentReceipt.hash },
  operations: [universityRegistration, studentRegistration, issuance, revocation].map(({receipt,latency},index)=>transactionRecord(["registerUniversity","registerStudent","issueCertificate","revokeCertificate"][index],receipt,latency)),
  verification: { samples: verificationSamples.length, averageMs: Number(avgVerification.toFixed(3)), minMs: Number(Math.min(...verificationSamples).toFixed(3)), maxMs: Number(Math.max(...verificationSamples).toFixed(3)), gasUsed: 0, note: "Read-only eth_call; no transaction fee." },
  scalability
};

const rawDir=resolve(projectRoot,"results","raw"), csvDir=resolve(projectRoot,"results","csv"), summaryDir=resolve(projectRoot,"results","summary");
await Promise.all([mkdir(rawDir,{recursive:true}),mkdir(csvDir,{recursive:true}),mkdir(summaryDir,{recursive:true})]);
const stamp=summary.generatedAt.replace(/[:.]/g,"-");
await writeFile(resolve(rawDir,`benchmark-${stamp}.json`),`${JSON.stringify({summary,transactions:rawTransactions,verificationSamples},null,2)}\n`);
await writeFile(resolve(summaryDir,"current.json"),`${JSON.stringify(summary,null,2)}\n`);
await writeFile(resolve(csvDir,"deployment.csv"),`gas_used,gas_price_wei,fee_wei,fee_eth,block_number,transaction_hash\n${summary.deployment.gasUsed},${summary.deployment.gasPriceWei},${summary.deployment.feeWei},${summary.deployment.feeEth},${summary.deployment.blockNumber},${summary.deployment.transactionHash}\n`);
await writeFile(resolve(csvDir,"operation-gas.csv"),`operation,gas_used,gas_price_wei,fee_wei,latency_ms\n${summary.operations.map(row=>`${row.operation},${row.gasUsed},${row.gasPriceWei},${row.feeWei},${row.latencyMs}`).join("\n")}\n`);
await writeFile(resolve(csvDir,"verification-latency.csv"),`samples,average_ms,min_ms,max_ms,gas_used,note\n${summary.verification.samples},${summary.verification.averageMs},${summary.verification.minMs},${summary.verification.maxMs},0,"${summary.verification.note}"\n`);
await writeFile(resolve(csvDir,"scalability.csv"),`volume,successful,failed,average_issuance_latency_ms,average_block_confirmation_ms,tps,success_rate_percent,total_gas,average_gas\n${scalability.map(row=>`${row.volume},${row.successful},${row.failed},${row.averageIssuanceLatencyMs},${row.averageBlockConfirmationMs},${row.tps},${row.successRate},${row.totalGas},${row.averageGas}`).join("\n")}\n`);
console.log(JSON.stringify(summary,null,2));
