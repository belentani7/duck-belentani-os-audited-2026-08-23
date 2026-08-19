import { describe, expect, it } from "vitest";
import { canAccessClientPortal } from "../shared/client-access";

describe("canAccessClientPortal", () => {
  it("bloqueia anônimos e permite usuários identificados", () => {
    expect(canAccessClientPortal(null)).toBe(false);
    expect(canAccessClientPortal(undefined)).toBe(false);
    expect(canAccessClientPortal({ id: 7 })).toBe(true);
  });
});
