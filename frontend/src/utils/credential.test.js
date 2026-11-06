import { describe, expect, it, vi } from "vitest";
import { id } from "ethers";
import * as credential from "./credential.js";
import {
  classifyCertificate,
  hashBytes,
  identifierKey,
  normalizeIdentifier,
  verificationPath
} from "./credential.js";

describe("credential utilities", () => {
  it("normalizes identifiers consistently before hashing", () => {
    expect(normalizeIdentifier("  cert-2026-001  ")).toBe("CERT-2026-001");
    expect(normalizeIdentifier("cert   2026  001")).toBe("CERT 2026 001");
    expect(identifierKey(" cert-2026-001 ")).toBe(id("CERT-2026-001"));
  });

  it("hashes exact bytes with SHA-256", async () => {
    const digest = await hashBytes(new TextEncoder().encode("abc"));
    expect(digest).toBe("0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("hashes exact bytes when Web Crypto is unavailable on LAN HTTP", async () => {
    vi.stubGlobal("crypto", {});
    try {
      const digest = await hashBytes(new TextEncoder().encode("abc"));
      expect(digest).toBe("0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("classifies missing, valid, tampered, and revoked records with revocation precedence", () => {
    const stored = `0x${"11".repeat(32)}`;
    const changed = `0x${"22".repeat(32)}`;
    expect(classifyCertificate({ exists: false })).toBe("NOT_FOUND");
    expect(classifyCertificate({ exists: true, revoked: false, documentHash: stored })).toBe("VALID");
    expect(classifyCertificate({ exists: true, revoked: false, documentHash: stored }, stored)).toBe("VALID");
    expect(classifyCertificate({ exists: true, revoked: false, documentHash: stored }, changed)).toBe("TAMPERED");
    expect(classifyCertificate({ exists: true, revoked: true, documentHash: stored }, changed)).toBe("REVOKED");
  });

  it("encodes normalized identifiers into verification routes", () => {
    expect(verificationPath(" cert/2026 001 ")).toBe("/verify/CERT%2F2026%20001");
  });

  it("builds an absolute verification URL for the QR scanner", () => {
    expect(credential.verificationUrl?.(" cert-video-001 ", "http://192.168.0.184:5173/"))
      .toBe("http://192.168.0.184:5173/verify/CERT-VIDEO-001");
  });

  it("distinguishes phone-reachable network origins from loopback origins", () => {
    expect(credential.isPhoneReachableOrigin?.("http://192.168.0.184:5173")).toBe(true);
    expect(credential.isPhoneReachableOrigin?.("http://localhost:5173")).toBe(false);
    expect(credential.isPhoneReachableOrigin?.("http://127.0.0.1:5173")).toBe(false);
  });
});
