import { network } from "hardhat";
import { key, readDeployment } from "./helpers.js";

const { ethers } = await network.create();
const [admin, university] = await ethers.getSigners();
const deployment = await readDeployment();
const contract = await ethers.getContractAt("AcademicCertificateVerification", deployment.address, admin);
const universityRecord = await contract.getUniversity(university.address);
if (!universityRecord.exists) await (await contract.registerUniversity(university.address, "Northbridge Demonstration University")).wait();

const studentKey = key(ethers, "STU-2026-001");
if (!(await contract.getStudent(studentKey)).exists) {
  await (await contract.connect(university).registerStudent(studentKey, "STU-2026-001", "Amina Rahman")).wait();
}
const certificateKey = key(ethers, "CERT-2026-001");
if (!(await contract.getCertificate(certificateKey)).exists) {
  const demoHash = ethers.sha256(ethers.toUtf8Bytes("CertLedger demonstration certificate PDF bytes"));
  await (await contract.connect(university).issueCertificate(certificateKey, "CERT-2026-001", studentKey, "MSc Computer Science", demoHash, 1789776000)).wait();
}
console.log(JSON.stringify({ admin: admin.address, university: university.address, certificateId: "CERT-2026-001" }, null, 2));
