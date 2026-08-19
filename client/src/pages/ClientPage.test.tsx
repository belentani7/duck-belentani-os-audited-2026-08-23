import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { workspace: { dashboard: { useQuery: () => ({ data: undefined, isLoading: false }) } } } }));
vi.mock("@/components/ClientPortal", () => ({ default: () => <div data-testid="client-portal">portal</div> }));

import ClientPage from "./ClientPage";

describe("ClientPage", () => {
  it("renderiza bloqueio e não carrega o portal para anônimos", () => {
    const html = renderToStaticMarkup(<ClientPage />);
    expect(html).toContain("Área privada de cliente");
    expect(html).not.toContain("data-testid=\"client-portal\"");
  });
});
