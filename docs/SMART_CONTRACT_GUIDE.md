# Smart Contract Guide

The final contract is `blockchain/contracts/AcademicCertificateVerification.sol`.

## State and structures

`administrator` is immutable and set to `msg.sender` in the constructor. `msg.sender` is the wallet making the current call; it is the basis for every role check.

- `University`: name, authorization flag, registration time, existence flag.
- `Student`: hashed and display IDs, name, owning university, registration time, existence flag.
- `Certificate`: hashed/display IDs, student key, degree, SHA-256 document digest, issuer, academic/on-chain dates, revocation fields, existence flag.

Mappings provide constant-time lookup. Arrays hold keys for paginated dashboard reads. Per-university arrays avoid scanning all students/certificates. State-changing functions never loop over the full registry.

## Memory and storage

`Student storage student` and `Certificate storage certificate` are references to persistent contract state, so modifying the referenced certificate during revocation changes the chain record. Getter returns use `memory` copies so callers can read but not mutate storage. `calldata` is used for external string inputs to avoid unnecessary copies.

## Access control

- `onlyAdministrator`: only the deployer can register universities or change their authorization.
- `onlyAuthorizedUniversity`: the caller must exist and currently be authorized.
- Issuance additionally checks that the student belongs to the caller.
- Revocation additionally checks that the caller is the original issuer.

Custom errors reduce gas and make failure branches explicit. The contract rejects zero addresses, empty required strings, zero hashes, duplicates, missing students/certificates, cross-university issuance, cross-issuer revocation, and double revocation.

## Functions

- `registerUniversity`: creates one authorized university and indexes it.
- `setUniversityAuthorization`: deactivates/reactivates an existing university.
- `registerStudent`: creates a globally unique student ID owned by the caller.
- `issueCertificate`: creates an immutable proof after all role/ownership checks.
- `revokeCertificate`: sets permanent status, time, and reason; it never deletes.
- `verifyCertificate`: returns enum values `NotFound(0)`, `Valid(1)`, `Revoked(2)`, or `Tampered(3)`; a zero presented hash means record-only verification.
- Getter/count/pagination functions support dashboards without unbounded writes.

## Events

`UniversityRegistered`, `UniversityAuthorizationChanged`, `StudentRegistered`, `CertificateIssued`, and `CertificateRevoked` form an auditable history. Addresses and ID hashes are indexed where useful for filtering.

## Security and privacy limitations

The contract stores student display IDs and names for explainable coursework demonstration. A production system should minimize or pseudonymize those values. Revocation reasons are public forever. Administrator key compromise affects university authorization; issuer key compromise affects future records for that university. There is no upgrade mechanism, multisignature governance, or key recovery in this intentionally small prototype.
