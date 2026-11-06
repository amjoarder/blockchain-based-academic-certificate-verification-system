export function calculateFeeWei(gasUsed, gasPrice) {
  return BigInt(gasUsed) * BigInt(gasPrice);
}

export function summarizeBatch({ volume, latenciesMs, gasUsed, elapsedMs }) {
  const successful = latenciesMs.length;
  const totalLatency = latenciesMs.reduce((sum, value) => sum + value, 0);
  const totalGas = gasUsed.reduce((sum, value) => sum + BigInt(value), 0n);
  return {
    volume,
    successful,
    failed: volume - successful,
    averageIssuanceLatencyMs: successful ? Number((totalLatency / successful).toFixed(2)) : 0,
    averageBlockConfirmationMs: successful ? Number((totalLatency / successful).toFixed(2)) : 0,
    tps: elapsedMs > 0 ? Number((successful / (elapsedMs / 1000)).toFixed(2)) : 0,
    successRate: Number(((successful / volume) * 100).toFixed(2)),
    totalGas: totalGas.toString(),
    averageGas: successful ? Number(totalGas / BigInt(successful)) : 0
  };
}
