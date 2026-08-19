import { describe, expect, it } from "vitest";
import { opportunityInput } from "./routers";
import { isAdminUser, isAuthenticatedUser } from "./_core/trpc";

describe("workspace briefing contract", () => {
  it("accepts a complete commercial briefing", () => {
    const result = opportunityInput.safeParse({
      clientName: "Artista Recife",
      service: "Mix + master",
      durationMinutes: 180,
      trackCount: 8,
      deadlineDays: 7,
    });
    expect(result.success).toBe(true);
  });

  it("rejects incomplete or unsafe briefing values", () => {
    const result = opportunityInput.safeParse({
      clientName: "x",
      service: "Mix + master",
      durationMinutes: 5,
      trackCount: 0,
      deadlineDays: 120,
    });
    expect(result.success).toBe(false);
  });
});

describe("workspace permissions", () => {
  it("requires an authenticated user", () => {
    expect(isAuthenticatedUser(null)).toBe(false);
    expect(isAuthenticatedUser({ id: 10, role: "user" } as never)).toBe(true);
  });

  it("allows administrative actions only for admins", () => {
    expect(isAdminUser({ id: 10, role: "user" } as never)).toBe(false);
    expect(isAdminUser({ id: 10, role: "admin" } as never)).toBe(true);
  });
});
