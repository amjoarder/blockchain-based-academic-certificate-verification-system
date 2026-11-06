import React, { useEffect, useState } from "react";
import { FileUp, Search } from "lucide-react";
import { useParams } from "react-router-dom";
import { Panel, PageHeader, ShortAddress, Status } from "../components/UI.jsx";
import { readContract } from "../services/blockchain.js";
import { classifyCertificate, hashFile, identifierKey, normalizeIdentifier } from "../utils/credential.js";
import { humanizeContractError } from "../utils/errors.js";

const statusCopy = {
  VALID: ["success", "Valid credential", "The record is active and the supplied file, if any, matches the stored proof."],
  REVOKED: ["error", "Revoked credential", "The issuer has revoked this credential. It must not be treated as active."],
  TAMPERED: ["warning", "File does not match", "The uploaded file hash differs from the registered certificate proof."],
  NOT_FOUND: ["empty", "Certificate not found", "No on-chain record exists for this certificate ID."]
};

export function VerifyPage() {
  const params = useParams();
  const [certificateId, setCertificateId] = useState(params.certificateId ? decodeURIComponent(params.certificateId) : "");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function verify(event) {
    event?.preventDefault(); setBusy(true); setError(""); setResult(null);
    try {
      const normalized = normalizeIdentifier(certificateId);
      if (!normalized) throw new Error("Enter a certificate ID.");
      if (file && file.type !== "application/pdf") throw new Error("Choose a PDF file for cryptographic comparison.");
      const uploadedHash = file ? await hashFile(file) : null;
      const { contract } = readContract();
      const certificate = await contract.getCertificate(identifierKey(normalized));
      const university = certificate.exists ? await contract.getUniversity(certificate.issuer) : null;
      setResult({ status: classifyCertificate(certificate, uploadedHash), certificate, university, uploadedHash });
    } catch (reason) { setError(reason.message?.startsWith("Enter") || reason.message?.startsWith("Choose") || reason.message?.startsWith("Contract") ? reason.message : humanizeContractError(reason)); }
    finally { setBusy(false); }
  }

  useEffect(() => { if (params.certificateId) verify(); }, []);
  const copy = result ? statusCopy[result.status] : null;
  return <div className="page-width page"><PageHeader eyebrow="Public verification" title="Verify an academic certificate" description="Look up an ID, then optionally select the original PDF for an exact local hash comparison." />
    <div className="verify-layout"><Panel title="Credential lookup" description="No file is uploaded or stored by this application."><form className="form" onSubmit={verify}><label>Certificate ID<input aria-label="Certificate ID" value={certificateId} onChange={(e) => setCertificateId(e.target.value)} placeholder="e.g. CERT-2026-001" required /></label><label className="file-field"><span>Certificate PDF <small>optional</small></span><span className="file-drop"><FileUp />{file ? file.name : "Choose a PDF to compare"}</span><input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label><button className="button primary" disabled={busy}><Search size={18} />{busy ? "Checking blockchain…" : "Verify certificate"}</button></form>{error && <Status type="error" title="Verification unavailable">{error}</Status>}</Panel>
      <Panel title="Verification result" description="Status comes from the current local blockchain state." className="result-panel">{!result && !busy && <div className="empty-result"><Search size={32} /><p>Enter a certificate ID to inspect its issuer, proof, and current status.</p></div>}{busy && <Status type="pending" title="Reading blockchain">Computing the file hash and fetching the current record.</Status>}{result && <><Status type={copy[0]} title={copy[1]}>{copy[2]}</Status>{result.certificate.exists && <dl className="details"><div><dt>Certificate ID</dt><dd>{result.certificate.certificateId}</dd></div><div><dt>Degree / program</dt><dd>{result.certificate.degree}</dd></div><div><dt>University</dt><dd>{result.university.name}</dd></div><div><dt>Issuer wallet</dt><dd><ShortAddress value={result.certificate.issuer} /></dd></div><div><dt>Issued on-chain</dt><dd>{new Date(Number(result.certificate.issuedAt) * 1000).toLocaleString()}</dd></div><div><dt>Document proof</dt><dd><code>{result.certificate.documentHash}</code></dd></div>{result.certificate.revoked && <div><dt>Revocation reason</dt><dd>{result.certificate.revocationReason}</dd></div>}</dl>}</>}</Panel></div>
  </div>;
}
