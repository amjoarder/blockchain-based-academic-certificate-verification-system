import React from "react";
import { ArrowRight, Blocks, FileCheck2, QrCode, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingPage() {
  return <>
    <section className="hero page-width">
      <div className="hero-copy"><span className="eyebrow">Blockchain-backed academic records</span><h1>Credentials that can be checked, not merely trusted.</h1><p>VeriCred Academic Registry lets institutions register verifiable certificate proofs and lets anyone compare a credential with its immutable on-chain record.</p><div className="hero-actions"><Link className="button primary" to="/verify">Verify a certificate <ArrowRight size={18} /></Link><Link className="button secondary" to="/university">Institution portal</Link></div><div className="trust-note"><ShieldCheck size={19} /><span>Files stay on your device. Only the cryptographic digest is compared.</span></div></div>
      <div className="hero-visual" aria-label="Credential verification illustration"><div className="seal"><FileCheck2 size={52} /><strong>Verified proof</strong><span>Issuer · Integrity · Status</span></div><div className="chain-line"><span /><span /><span /></div></div>
    </section>
    <section className="page-width section"><div className="section-intro"><span className="eyebrow">A transparent workflow</span><h2>Three checks, one clear result</h2></div><div className="feature-grid">
      <article><span className="icon-box"><Blocks /></span><b>1</b><h3>Find the record</h3><p>The certificate ID resolves to a record created by an administrator-approved university.</p></article>
      <article><span className="icon-box"><FileCheck2 /></span><b>2</b><h3>Compare the file</h3><p>Your browser hashes the exact PDF bytes and compares the digest with the blockchain proof.</p></article>
      <article><span className="icon-box"><QrCode /></span><b>3</b><h3>Read current status</h3><p>The live result distinguishes valid, revoked, tampered, and unknown credentials.</p></article>
    </div></section>
    <section className="page-width caveat"><ShieldCheck /><div><h2>What the blockchain proves</h2><p>It proves which wallet recorded a claim, whether a file still matches that claim, and whether the issuer revoked it. It does not independently prove that information entered by an authorized issuer was truthful.</p></div></section>
  </>;
}
