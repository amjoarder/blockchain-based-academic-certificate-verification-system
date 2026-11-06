import { network } from "hardhat";
import { key } from "./helpers.js";

const { ethers } = await network.create();
const [admin, issuer] = await ethers.getSigners();
const contract = await ethers.deployContract("AcademicCertificateVerification");
await contract.waitForDeployment();
await (await contract.connect(admin).registerUniversity(issuer.address, "Smoke Test University")).wait();
const studentKey = key(ethers, "SMOKE-STUDENT");
await (await contract.connect(issuer).registerStudent(studentKey, "SMOKE-STUDENT", "Smoke Test Student")).wait();
const certificateKey = key(ethers, "CERT-2026-001");
const originalHash = ethers.sha256(ethers.toUtf8Bytes("CertLedger demonstration certificate PDF bytes"));
const changedHash = ethers.sha256(ethers.toUtf8Bytes("changed bytes"));
await (await contract.connect(issuer).issueCertificate(certificateKey, "CERT-2026-001", studentKey, "Smoke Test Degree", originalHash, 1789776000)).wait();
const statuses = {
  notFound: Number(await contract.verifyCertificate(key(ethers, "MISSING"), ethers.ZeroHash)),
  valid: Number(await contract.verifyCertificate(certificateKey, originalHash)),
  tampered: Number(await contract.verifyCertificate(certificateKey, changedHash))
};
if (statuses.notFound !== 0 || statuses.valid !== 1 || statuses.tampered !== 3) throw new Error(`Unexpected verification statuses: ${JSON.stringify(statuses)}`);
const certificate = await contract.getCertificate(certificateKey);
if (!certificate.revoked) await (await contract.connect(issuer).revokeCertificate(certificateKey, "Demonstration revocation")).wait();
statuses.revoked = Number(await contract.verifyCertificate(certificateKey, originalHash));
if (statuses.revoked !== 2) throw new Error(`Expected revoked status, received ${statuses.revoked}`);
console.log(JSON.stringify({ passed: true, statuses, certificateId: "CERT-2026-001" }, null, 2));
