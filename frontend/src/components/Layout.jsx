import React from "react";
import { Award, BarChart3, Building2, Menu, Search, ShieldCheck, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";

const links = [
  ["/verify", "Verify", Search],
  ["/admin", "Administrator", ShieldCheck],
  ["/university", "University", Building2],
  ["/performance", "Performance", BarChart3]
];

export function Layout({ children }) {
  const [open, setOpen] = useState(false);
  return <div className="app-shell">
    <header className="topbar">
      <NavLink className="brand" to="/" aria-label="VeriCred Academic Registry" onClick={() => setOpen(false)}>
        <span className="brand-mark"><Award size={20} /></span>
        <span><strong>VeriCred</strong><small>Academic Registry</small></span>
      </NavLink>
      <button className="menu-button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <nav className={open ? "nav open" : "nav"} aria-label="Primary navigation">
        {links.map(([to, label, Icon]) => <NavLink key={to} to={to} onClick={() => setOpen(false)}><Icon size={17} />{label}</NavLink>)}
      </nav>
    </header>
    <main>{children}</main>
    <footer><span>VeriCred Academic Registry · Coursework prototype</span><span>Local Hardhat network · No production credentials</span></footer>
  </div>;
}
