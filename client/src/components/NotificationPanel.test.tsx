// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import NotificationPanel, { buildPreferencePayload } from "./NotificationPanel";
afterEach(() => cleanup());

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), refetch: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: { workspace: { notificationPreferences: { useQuery: () => ({ data: [], isLoading: false, refetch: mocks.refetch }) }, leadSearches: { useQuery: () => ({ data: [], isLoading: false, refetch: mocks.refetch }) }, saveNotificationPreference: { useMutation: () => ({ isPending: false, mutate: mocks.mutate }) }, scheduleLeadRefresh: { useMutation: () => ({ isPending: false, mutate: mocks.mutate }) }, disableLeadRefresh: { useMutation: () => ({ isPending: false, mutate: mocks.mutate }) }, runLeadRefresh: { useMutation: () => ({ isPending: false, mutate: mocks.mutate }) } } } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("NotificationPanel", () => {
  it("constrói payload de salvamento com eventos selecionados", () => {
    expect(buildPreferencePayload("telegram", "@duck_prod", true, ["render", "client"])).toEqual({ channel: "telegram", destination: "@duck_prod", enabled: true, eventTypes: ["render", "client"] });
  });

  it("salva a preferência selecionada no tRPC ao clicar", () => {
    render(<NotificationPanel />);
    fireEvent.change(screen.getByLabelText("Canal"), { target: { value: "telegram" } });
    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: "@duck_prod" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar canal/i }));
    expect(mocks.mutate).toHaveBeenCalledWith({ channel: "telegram", destination: "@duck_prod", enabled: true, eventTypes: ["render", "client", "money", "lead"] });
  });

  it("apresenta canais configuráveis e estado vazio", () => {
    render(<NotificationPanel />);
    expect(screen.getByText("Telegram")).toBeTruthy();
    expect(screen.getByText("WhatsApp")).toBeTruthy();
    expect(screen.getByText("Nenhum canal externo configurado ainda.")).toBeTruthy();
    expect(screen.getByText(/Alertas automáticos de leads usam atualmente apenas o feed interno/i)).toBeTruthy();
  });
});
