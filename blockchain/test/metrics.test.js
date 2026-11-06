import { expect } from "chai";
import { calculateFeeWei, summarizeBatch } from "../lib/metrics.js";

describe("benchmark metric calculations", function () {
  it("calculates transaction fee from receipt gas values", function () {
    expect(calculateFeeWei(21000n, 2_000_000_000n)).to.equal(42_000_000_000_000n);
  });

  it("derives latency, throughput, gas, and success rate from attempted operations", function () {
    expect(summarizeBatch({ volume: 4, latenciesMs: [10, 20, 30], gasUsed: [100n, 110n, 120n], elapsedMs: 1000 })).to.deep.equal({
      volume: 4,
      successful: 3,
      failed: 1,
      averageIssuanceLatencyMs: 20,
      averageBlockConfirmationMs: 20,
      tps: 3,
      successRate: 75,
      totalGas: "330",
      averageGas: 110
    });
  });
});
