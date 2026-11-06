import React from "react";
import { AlertCircle, CheckCircle2, Clock3, FileWarning, SearchX } from "lucide-react";

export function PageHeader({ eyebrow, title, description, actions }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{actions && <div className="header-actions">{actions}</div>}</div>;
}

export function Panel({ title, description, children, className = "" }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><h2>{title}</h2>{description && <p>{description}</p>}</div>{children}</section>;
}

export function Status({ type, title, children }) {
  const icons = { success: CheckCircle2, error: AlertCircle, warning: FileWarning, empty: SearchX, pending: Clock3 };
  const Icon = icons[type] || AlertCircle;
  return <div className={`status status-${type}`} role="status"><Icon /><div><strong>{title}</strong>{children && <p>{children}</p>}</div></div>;
}

export function Stat({ label, value, detail }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>;
}

export function ShortAddress({ value }) {
  return value ? <code title={value}>{`${value.slice(0, 6)}…${value.slice(-4)}`}</code> : <span>—</span>;
}
