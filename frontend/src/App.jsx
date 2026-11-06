import React, { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.jsx";

const AdminPage = lazy(() => import("./pages/AdminPage.jsx").then((module) => ({ default: module.AdminPage })));
const LandingPage = lazy(() => import("./pages/LandingPage.jsx").then((module) => ({ default: module.LandingPage })));
const PerformancePage = lazy(() => import("./pages/PerformancePage.jsx").then((module) => ({ default: module.PerformancePage })));
const UniversityPage = lazy(() => import("./pages/UniversityPage.jsx").then((module) => ({ default: module.UniversityPage })));
const VerifyPage = lazy(() => import("./pages/VerifyPage.jsx").then((module) => ({ default: module.VerifyPage })));

export function AppRoutes() {
  return <Layout><Suspense fallback={<div className="page-width page">Loading…</div>}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/verify" element={<VerifyPage />} />
    <Route path="/verify/:certificateId" element={<VerifyPage />} />
    <Route path="/admin" element={<AdminPage />} />
    <Route path="/university" element={<UniversityPage />} />
    <Route path="/performance" element={<PerformancePage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></Layout>;
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
