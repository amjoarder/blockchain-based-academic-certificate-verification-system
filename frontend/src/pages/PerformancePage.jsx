import React from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel, Stat, Status } from "../components/UI.jsx";
import summary from "../../../results/summary/current.json";

export function PerformancePage() {
  if (!summary?.completed) {
    return <div className="page-width page"><PageHeader eyebrow="Measured evidence" title="Blockchain performance" description="This page displays only measurements produced by the local benchmark." /><Status type="warning" title="Benchmark results are not available">Run the benchmark command to populate this dashboard. No placeholder values are shown.</Status></div>;
  }
  const rows = summary.scalability || [];
  return <div className="page-width page">
    <PageHeader eyebrow="Measured evidence" title="Blockchain performance" description={`Local Hardhat benchmark completed ${new Date(summary.generatedAt).toLocaleString()}.`} />
    <div className="stats-grid">
      <Stat label="Deployment gas" value={Number(summary.deployment.gasUsed).toLocaleString()} />
      <Stat label="Deployment fee" value={`${Number(summary.deployment.feeEth).toFixed(6)} ETH`} />
      <Stat label="Verification latency" value={`${summary.verification.averageMs} ms`} />
      <Stat label="Largest-volume success" value={`${rows.at(-1)?.successRate || 0}%`} />
    </div>
    <div className="chart-grid">
      <Panel title="Issuance latency by volume"><div className="chart"><ResponsiveContainer><LineChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="volume" /><YAxis /><Tooltip /><Line type="monotone" dataKey="averageIssuanceLatencyMs" stroke="#3157d5" strokeWidth={3} /></LineChart></ResponsiveContainer></div></Panel>
      <Panel title="Throughput by volume"><div className="chart"><ResponsiveContainer><BarChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="volume" /><YAxis /><Tooltip /><Bar dataKey="tps" fill="#188267" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel>
    </div>
    <Panel title="Scalability results" description="Every row comes from confirmed transactions on a fresh in-process chain."><div className="table-wrap"><table><thead><tr><th>Certificates</th><th>Avg latency (ms)</th><th>TPS</th><th>Success</th><th>Total gas</th></tr></thead><tbody>{rows.map((row) => <tr key={row.volume}><td>{row.volume}</td><td>{row.averageIssuanceLatencyMs}</td><td>{row.tps}</td><td>{row.successRate}%</td><td>{Number(row.totalGas).toLocaleString()}</td></tr>)}</tbody></table></div></Panel>
    <p className="method-note">Local Hardhat measurements describe this development environment, not public-network latency or capacity. Verification is a read-only RPC call and consumes no transaction gas.</p>
  </div>;
}
