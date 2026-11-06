import { expect } from "chai";
import { network } from "hardhat";
import { id, keccak256, toUtf8Bytes, ZeroAddress, ZeroHash } from "ethers";

const key = (value) => keccak256(toUtf8Bytes(value.trim().toUpperCase()));
const fileHash = (value) => keccak256(toUtf8Bytes(value));

describe("AcademicCertificateVerification", function () {
  let ethers;
  let admin;
  let university;
  let otherUniversity;
  let outsider;
  let contract;

  beforeEach(async function () {
    ({ ethers } = await network.create());
    [admin, university, otherUniversity, outsider] = await ethers.getSigners();
    contract = await ethers.deployContract("AcademicCertificateVerification");
    await contract.waitForDeployment();
  });

  async function registerUniversity(signer = university, name = "Northbridge University") {
    await contract.registerUniversity(signer.address, name);
  }

  async function registerStudent(signer = university, studentId = "STU-2026-001") {
    await registerUniversity(signer, signer === university ? "Northbridge University" : "Eastport University");
    await contract.connect(signer).registerStudent(key(studentId), studentId, "Amina Rahman");
  }

  async function issueCertificate() {
    await registerStudent();
    await contract.connect(university).issueCertificate(
      key("CERT-2026-001"),
      "CERT-2026-001",
      key("STU-2026-001"),
      "MSc Computer Science",
      fileHash("original-pdf"),
      1789776000
    );
  }

  it("sets the deployer as administrator", async function () {
    expect(await contract.administrator()).to.equal(admin.address);
  });

  it("allows only the administrator to register a nonzero university with a name", async function () {
    await expect(contract.connect(outsider).registerUniversity(university.address, "Northbridge University"))
      .to.be.revertedWithCustomError(contract, "OnlyAdministrator");
    await expect(contract.registerUniversity(ZeroAddress, "Northbridge University"))
      .to.be.revertedWithCustomError(contract, "ZeroAddress");
    await expect(contract.registerUniversity(university.address, ""))
      .to.be.revertedWithCustomError(contract, "EmptyField");
    await expect(contract.registerUniversity(university.address, "Northbridge University"))
      .to.emit(contract, "UniversityRegistered")
      .withArgs(university.address, "Northbridge University");
    const record = await contract.getUniversity(university.address);
    expect(record.name).to.equal("Northbridge University");
    expect(record.isAuthorized).to.equal(true);
    expect(await contract.getUniversityCount()).to.equal(1n);
  });

  it("prevents duplicate university registration and supports authorization changes", async function () {
    await registerUniversity();
    await expect(registerUniversity()).to.be.revertedWithCustomError(contract, "UniversityAlreadyExists");
    await expect(contract.connect(outsider).setUniversityAuthorization(university.address, false))
      .to.be.revertedWithCustomError(contract, "OnlyAdministrator");
    await expect(contract.setUniversityAuthorization(university.address, false))
      .to.emit(contract, "UniversityAuthorizationChanged").withArgs(university.address, false);
    expect((await contract.getUniversity(university.address)).isAuthorized).to.equal(false);
  });

  it("allows only active universities to register unique valid students", async function () {
    await registerUniversity();
    await expect(contract.connect(outsider).registerStudent(key("STU-1"), "STU-1", "Amina"))
      .to.be.revertedWithCustomError(contract, "OnlyAuthorizedUniversity");
    await expect(contract.connect(university).registerStudent(ZeroHash, "STU-1", "Amina"))
      .to.be.revertedWithCustomError(contract, "InvalidHash");
    await expect(contract.connect(university).registerStudent(key("STU-1"), "", "Amina"))
      .to.be.revertedWithCustomError(contract, "EmptyField");
    await expect(contract.connect(university).registerStudent(key("STU-1"), "STU-1", "Amina"))
      .to.emit(contract, "StudentRegistered");
    await expect(contract.connect(university).registerStudent(key("STU-1"), "STU-1", "Amina"))
      .to.be.revertedWithCustomError(contract, "StudentAlreadyExists");
    const student = await contract.getStudent(key("STU-1"));
    expect(student.university).to.equal(university.address);
    expect(await contract.getStudentCount()).to.equal(1n);
  });

  it("issues immutable certificates only for the caller's students", async function () {
    await registerStudent();
    await registerUniversity(otherUniversity, "Eastport University");
    const args = [key("CERT-1"), "CERT-1", key("STU-2026-001"), "BSc Engineering", fileHash("pdf"), 1789776000];
    await expect(contract.connect(otherUniversity).issueCertificate(...args))
      .to.be.revertedWithCustomError(contract, "StudentUniversityMismatch");
    await expect(contract.connect(university).issueCertificate(...args))
      .to.emit(contract, "CertificateIssued");
    await expect(contract.connect(university).issueCertificate(...args))
      .to.be.revertedWithCustomError(contract, "CertificateAlreadyExists");
    const certificate = await contract.getCertificate(key("CERT-1"));
    expect(certificate.documentHash).to.equal(fileHash("pdf"));
    expect(certificate.issuer).to.equal(university.address);
    expect(await contract.getCertificateCount()).to.equal(1n);
  });

  it("rejects issuance for missing students and empty certificate data", async function () {
    await registerUniversity();
    await expect(contract.connect(university).issueCertificate(ZeroHash, "CERT-1", key("STU-X"), "Degree", fileHash("pdf"), 1))
      .to.be.revertedWithCustomError(contract, "InvalidHash");
    await expect(contract.connect(university).issueCertificate(key("CERT-1"), "CERT-1", key("STU-X"), "Degree", fileHash("pdf"), 1))
      .to.be.revertedWithCustomError(contract, "StudentNotFound");
  });

  it("classifies not-found, valid, and tampered hashes", async function () {
    expect(await contract.verifyCertificate(key("MISSING"), ZeroHash)).to.equal(0n);
    await issueCertificate();
    expect(await contract.verifyCertificate(key("CERT-2026-001"), fileHash("original-pdf"))).to.equal(1n);
    expect(await contract.verifyCertificate(key("CERT-2026-001"), ZeroHash)).to.equal(1n);
    expect(await contract.verifyCertificate(key("CERT-2026-001"), fileHash("changed-pdf"))).to.equal(3n);
  });

  it("allows only the issuer to revoke once and makes revocation override hash status", async function () {
    await issueCertificate();
    await registerUniversity(otherUniversity, "Eastport University");
    await expect(contract.connect(otherUniversity).revokeCertificate(key("CERT-2026-001"), "Administrative correction"))
      .to.be.revertedWithCustomError(contract, "OnlyCertificateIssuer");
    await expect(contract.connect(university).revokeCertificate(key("CERT-2026-001"), ""))
      .to.be.revertedWithCustomError(contract, "EmptyField");
    await expect(contract.connect(university).revokeCertificate(key("CERT-2026-001"), "Administrative correction"))
      .to.emit(contract, "CertificateRevoked");
    expect(await contract.verifyCertificate(key("CERT-2026-001"), fileHash("changed-pdf"))).to.equal(2n);
    await expect(contract.connect(university).revokeCertificate(key("CERT-2026-001"), "Again"))
      .to.be.revertedWithCustomError(contract, "CertificateAlreadyRevoked");
    expect(await contract.getRevokedCertificateCount()).to.equal(1n);
  });

  it("returns paginated indexes without unbounded state-changing loops", async function () {
    await registerUniversity();
    await contract.connect(university).registerStudent(key("STU-1"), "STU-1", "Amina");
    await contract.connect(university).registerStudent(key("STU-2"), "STU-2", "Nabil");
    expect(await contract.getUniversities(0, 10)).to.deep.equal([university.address]);
    expect(await contract.getStudentKeys(1, 10)).to.deep.equal([key("STU-2")]);
    expect(await contract.getStudentKeys(5, 10)).to.deep.equal([]);
  });
});
