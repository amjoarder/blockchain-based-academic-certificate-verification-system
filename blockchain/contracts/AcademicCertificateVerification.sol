// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title Academic Certificate Verification
/// @notice Local-first academic credential registry for coursework demonstration.
/// @dev The ledger proves issuer action and record integrity, not the truth of issuer-entered claims.
contract AcademicCertificateVerification {
    enum VerificationStatus { NotFound, Valid, Revoked, Tampered }

    struct University {
        string name;
        bool isAuthorized;
        uint64 registeredAt;
        bool exists;
    }

    struct Student {
        bytes32 idHash;
        string studentId;
        string name;
        address university;
        uint64 registeredAt;
        bool exists;
    }

    struct Certificate {
        bytes32 idHash;
        string certificateId;
        bytes32 studentIdHash;
        string degree;
        bytes32 documentHash;
        address issuer;
        uint64 academicIssueDate;
        uint64 issuedAt;
        bool revoked;
        uint64 revokedAt;
        string revocationReason;
        bool exists;
    }

    error OnlyAdministrator();
    error OnlyAuthorizedUniversity();
    error OnlyCertificateIssuer();
    error ZeroAddress();
    error EmptyField();
    error InvalidHash();
    error UniversityAlreadyExists();
    error UniversityNotFound();
    error StudentAlreadyExists();
    error StudentNotFound();
    error StudentUniversityMismatch();
    error CertificateAlreadyExists();
    error CertificateNotFound();
    error CertificateAlreadyRevoked();

    event UniversityRegistered(address indexed university, string name);
    event UniversityAuthorizationChanged(address indexed university, bool isAuthorized);
    event StudentRegistered(bytes32 indexed studentIdHash, string studentId, address indexed university);
    event CertificateIssued(bytes32 indexed certificateIdHash, string certificateId, bytes32 indexed studentIdHash, address indexed issuer, bytes32 documentHash);
    event CertificateRevoked(bytes32 indexed certificateIdHash, address indexed issuer, string reason);

    address public immutable administrator;
    uint256 private revokedCertificateCount;

    mapping(address => University) private universities;
    mapping(bytes32 => Student) private students;
    mapping(bytes32 => Certificate) private certificates;
    address[] private universityAddresses;
    bytes32[] private studentKeys;
    bytes32[] private certificateKeys;
    mapping(address => bytes32[]) private universityStudentKeys;
    mapping(address => bytes32[]) private universityCertificateKeys;

    constructor() {
        administrator = msg.sender;
    }

    modifier onlyAdministrator() {
        if (msg.sender != administrator) revert OnlyAdministrator();
        _;
    }

    modifier onlyAuthorizedUniversity() {
        if (!universities[msg.sender].exists || !universities[msg.sender].isAuthorized) {
            revert OnlyAuthorizedUniversity();
        }
        _;
    }

    function registerUniversity(address university, string calldata name) external onlyAdministrator {
        if (university == address(0)) revert ZeroAddress();
        if (bytes(name).length == 0) revert EmptyField();
        if (universities[university].exists) revert UniversityAlreadyExists();
        universities[university] = University(name, true, uint64(block.timestamp), true);
        universityAddresses.push(university);
        emit UniversityRegistered(university, name);
    }

    function setUniversityAuthorization(address university, bool isAuthorized) external onlyAdministrator {
        if (!universities[university].exists) revert UniversityNotFound();
        universities[university].isAuthorized = isAuthorized;
        emit UniversityAuthorizationChanged(university, isAuthorized);
    }

    function registerStudent(bytes32 studentIdHash, string calldata studentId, string calldata name) external onlyAuthorizedUniversity {
        if (studentIdHash == bytes32(0)) revert InvalidHash();
        if (bytes(studentId).length == 0 || bytes(name).length == 0) revert EmptyField();
        if (students[studentIdHash].exists) revert StudentAlreadyExists();
        students[studentIdHash] = Student(studentIdHash, studentId, name, msg.sender, uint64(block.timestamp), true);
        studentKeys.push(studentIdHash);
        universityStudentKeys[msg.sender].push(studentIdHash);
        emit StudentRegistered(studentIdHash, studentId, msg.sender);
    }

    function issueCertificate(
        bytes32 certificateIdHash,
        string calldata certificateId,
        bytes32 studentIdHash,
        string calldata degree,
        bytes32 documentHash,
        uint64 academicIssueDate
    ) external onlyAuthorizedUniversity {
        if (certificateIdHash == bytes32(0) || documentHash == bytes32(0)) revert InvalidHash();
        if (bytes(certificateId).length == 0 || bytes(degree).length == 0) revert EmptyField();
        if (certificates[certificateIdHash].exists) revert CertificateAlreadyExists();
        Student storage student = students[studentIdHash];
        if (!student.exists) revert StudentNotFound();
        if (student.university != msg.sender) revert StudentUniversityMismatch();

        certificates[certificateIdHash] = Certificate({
            idHash: certificateIdHash,
            certificateId: certificateId,
            studentIdHash: studentIdHash,
            degree: degree,
            documentHash: documentHash,
            issuer: msg.sender,
            academicIssueDate: academicIssueDate,
            issuedAt: uint64(block.timestamp),
            revoked: false,
            revokedAt: 0,
            revocationReason: "",
            exists: true
        });
        certificateKeys.push(certificateIdHash);
        universityCertificateKeys[msg.sender].push(certificateIdHash);
        emit CertificateIssued(certificateIdHash, certificateId, studentIdHash, msg.sender, documentHash);
    }

    function revokeCertificate(bytes32 certificateIdHash, string calldata reason) external onlyAuthorizedUniversity {
        Certificate storage certificate = certificates[certificateIdHash];
        if (!certificate.exists) revert CertificateNotFound();
        if (certificate.issuer != msg.sender) revert OnlyCertificateIssuer();
        if (certificate.revoked) revert CertificateAlreadyRevoked();
        if (bytes(reason).length == 0) revert EmptyField();
        certificate.revoked = true;
        certificate.revokedAt = uint64(block.timestamp);
        certificate.revocationReason = reason;
        unchecked { revokedCertificateCount++; }
        emit CertificateRevoked(certificateIdHash, msg.sender, reason);
    }

    function verifyCertificate(bytes32 certificateIdHash, bytes32 presentedDocumentHash) external view returns (VerificationStatus) {
        Certificate storage certificate = certificates[certificateIdHash];
        if (!certificate.exists) return VerificationStatus.NotFound;
        if (certificate.revoked) return VerificationStatus.Revoked;
        if (presentedDocumentHash != bytes32(0) && presentedDocumentHash != certificate.documentHash) {
            return VerificationStatus.Tampered;
        }
        return VerificationStatus.Valid;
    }

    function getUniversity(address university) external view returns (University memory) { return universities[university]; }
    function getStudent(bytes32 studentIdHash) external view returns (Student memory) { return students[studentIdHash]; }
    function getCertificate(bytes32 certificateIdHash) external view returns (Certificate memory) { return certificates[certificateIdHash]; }
    function getUniversityCount() external view returns (uint256) { return universityAddresses.length; }
    function getStudentCount() external view returns (uint256) { return studentKeys.length; }
    function getCertificateCount() external view returns (uint256) { return certificateKeys.length; }
    function getRevokedCertificateCount() external view returns (uint256) { return revokedCertificateCount; }

    function getUniversities(uint256 offset, uint256 limit) external view returns (address[] memory) {
        return _sliceAddresses(universityAddresses, offset, limit);
    }

    function getStudentKeys(uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        return _sliceKeys(studentKeys, offset, limit);
    }

    function getCertificateKeys(uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        return _sliceKeys(certificateKeys, offset, limit);
    }

    function getUniversityStudentKeys(address university, uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        return _sliceKeys(universityStudentKeys[university], offset, limit);
    }

    function getUniversityCertificateKeys(address university, uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        return _sliceKeys(universityCertificateKeys[university], offset, limit);
    }

    function _sliceAddresses(address[] storage source, uint256 offset, uint256 limit) private view returns (address[] memory result) {
        if (offset >= source.length || limit == 0) return new address[](0);
        uint256 end = offset + limit;
        if (end > source.length || end < offset) end = source.length;
        result = new address[](end - offset);
        for (uint256 i; i < result.length; ++i) result[i] = source[offset + i];
    }

    function _sliceKeys(bytes32[] storage source, uint256 offset, uint256 limit) private view returns (bytes32[] memory result) {
        if (offset >= source.length || limit == 0) return new bytes32[](0);
        uint256 end = offset + limit;
        if (end > source.length || end < offset) end = source.length;
        result = new bytes32[](end - offset);
        for (uint256 i; i < result.length; ++i) result[i] = source[offset + i];
    }
}
