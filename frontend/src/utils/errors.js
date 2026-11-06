const customErrors = {
  OnlyAdministrator: "Only the administrator can perform this action.",
  OnlyAuthorizedUniversity: "This wallet is not an authorized university.",
  OnlyCertificateIssuer: "Only the university that issued this certificate can revoke it.",
  UniversityAlreadyExists: "That university wallet is already registered.",
  StudentAlreadyExists: "That student ID is already registered.",
  StudentNotFound: "The student ID was not found.",
  StudentUniversityMismatch: "The student belongs to a different university.",
  CertificateAlreadyExists: "That certificate ID already exists.",
  CertificateNotFound: "The certificate was not found.",
  CertificateAlreadyRevoked: "The certificate has already been revoked.",
  EmptyField: "Complete every required field.",
  InvalidHash: "The certificate or document hash is invalid."
};

export function humanizeContractError(error) {
  if (error?.code === 4001 || error?.code === "ACTION_REJECTED") return "The wallet request was cancelled.";
  const name = error?.revert?.name || error?.errorName;
  if (name && customErrors[name]) return customErrors[name];
  if (/network|rpc|coalesce/i.test(error?.shortMessage || error?.message || "")) {
    return "The blockchain request could not be completed. Check that the local node and network are available.";
  }
  return "The transaction could not be completed. Review the form and wallet network, then try again.";
}
