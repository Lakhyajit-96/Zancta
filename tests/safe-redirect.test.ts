import { describe, it, expect } from "vitest";
import { safeInternalPath } from "@/lib/safe-redirect";

describe("safeInternalPath", () => {
  it("allows same-origin relative paths", () => {
    expect(safeInternalPath("/account")).toBe("/account");
    expect(safeInternalPath("/pricing?plan=premium")).toBe("/pricing?plan=premium");
  });

  it("rejects absolute and protocol-relative open redirects", () => {
    expect(safeInternalPath("https://evil.example/phish")).toBe("/account");
    expect(safeInternalPath("//evil.example/phish")).toBe("/account");
    expect(safeInternalPath("/\\evil.example")).toBe("/account");
    expect(safeInternalPath("https://zancta.tech.evil.example/")).toBe("/account");
  });

  it("rejects encoded slash tricks", () => {
    expect(safeInternalPath("/%2f%2fevil.example")).toBe("/account");
    expect(safeInternalPath("/%2F%2Fevil.example")).toBe("/account");
    expect(safeInternalPath("/%5c%5cevil.example")).toBe("/account");
  });

  it("falls back for missing or empty values", () => {
    expect(safeInternalPath(null)).toBe("/account");
    expect(safeInternalPath("")).toBe("/account");
    expect(safeInternalPath("account")).toBe("/account");
  });
});
