import { describe, expect, it } from "vitest";
import * as blockchain from "./blockchain.js";
import { toUniversityView } from "./blockchain.js";

describe("blockchain result mapping", () => {
  it("preserves named fields from a non-enumerable ethers result", () => {
    const result = [];
    Object.defineProperties(result, {
      name: { value: "Northbridge Demonstration University" },
      isAuthorized: { value: true },
      registeredAt: { value: 1789999999n },
      exists: { value: true }
    });
    expect(toUniversityView("0x1234", result)).toEqual({
      address: "0x1234",
      name: "Northbridge Demonstration University",
      isAuthorized: true,
      registeredAt: 1789999999n,
      exists: true
    });
  });

  it("routes browser reads through the current app origin", () => {
    expect(blockchain.readRpcUrl?.("http://192.168.0.184:5173")).toBe("http://192.168.0.184:5173/rpc");
    expect(blockchain.readRpcUrl?.("http://localhost:5173/")).toBe("http://localhost:5173/rpc");
  });

  it("falls back to the loopback RPC when no browser origin exists", () => {
    expect(blockchain.readRpcUrl?.()).toBe("http://127.0.0.1:8545");
  });
});
