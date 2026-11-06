import { describe, expect, it } from "vitest";
import { humanizeContractError } from "./errors.js";

describe("humanizeContractError", () => {
  it("translates wallet rejection and contract custom errors", () => {
    expect(humanizeContractError({ code: 4001 })).toContain("cancelled");
    expect(humanizeContractError({ revert: { name: "OnlyAdministrator" } })).toContain("administrator");
    expect(humanizeContractError({ shortMessage: "could not coalesce error" })).toContain("could not be completed");
  });
});
