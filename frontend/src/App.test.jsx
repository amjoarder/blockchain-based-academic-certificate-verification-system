// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "./App.jsx";

describe("application routes", () => {
  it("renders the public academic verification landing page", async () => {
    render(<MemoryRouter initialEntries={["/"]}><AppRoutes /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: /credentials that can be checked/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /vericred academic registry/i }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: /verify a certificate/i }).getAttribute("href")).toBe("/verify");
  });

  it("uses a certificate id supplied by a QR verification route", async () => {
    render(<MemoryRouter initialEntries={["/verify/CERT-2026-001"]}><AppRoutes /></MemoryRouter>);
    expect((await screen.findByLabelText(/certificate id/i)).value).toBe("CERT-2026-001");
  });
});
