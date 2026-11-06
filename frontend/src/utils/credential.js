import { id, sha256 } from "ethers";

export function normalizeIdentifier(value = "") {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export function identifierKey(value) {
  return id(normalizeIdentifier(value));
}

export async function hashBytes(bytes) {
  if (!globalThis.crypto?.subtle?.digest) return sha256(new Uint8Array(bytes));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return `0x${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function hashFile(file) {
  return hashBytes(await file.arrayBuffer());
}

export function classifyCertificate(certificate, presentedHash) {
  if (!certificate?.exists) return "NOT_FOUND";
  if (certificate.revoked) return "REVOKED";
  if (presentedHash && presentedHash.toLowerCase() !== certificate.documentHash.toLowerCase()) return "TAMPERED";
  return "VALID";
}

export function verificationPath(certificateId) {
  return `/verify/${encodeURIComponent(normalizeIdentifier(certificateId))}`;
}

export function verificationUrl(certificateId, origin = globalThis.location?.origin) {
  const base = origin?.replace(/\/+$/, "") || "";
  return `${base}${verificationPath(certificateId)}`;
}

export function isPhoneReachableOrigin(origin = globalThis.location?.origin) {
  if (!origin) return false;
  const hostname = new URL(origin).hostname;
  return !["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname);
}
