import express from "express";
import http from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  refreshLeadSearchByTaskUid: vi.fn(),
}));
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));
vi.mock("./leadAutomation", () => ({
  refreshLeadSearchByTaskUid: mocks.refreshLeadSearchByTaskUid,
  cronErrorPayload: (error: unknown, url: string, taskUid?: string) => ({ error: error instanceof Error ? error.message : String(error), context: { url, taskUid } }),
}));
const { registerScheduledLeadRoutes } = await import("./scheduledLeadRoutes");

async function withServer(run: (url: string) => Promise<void>) {
  const app = express();
  registerScheduledLeadRoutes(app);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("server address unavailable");
  try { await run(`http://127.0.0.1:${address.port}/api/scheduled/refreshLeads`); } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
}

describe("scheduled lead routes", () => {
  afterEach(() => vi.clearAllMocks());

  it("rejects non-cron authentication", async () => {
    mocks.authenticateRequest.mockResolvedValue({ isCron: false, taskUid: null });
    await withServer(async (url) => { const response = await fetch(url, { method: "POST" }); expect(response.status).toBe(403); expect(await response.json()).toEqual({ error: "cron-only" }); });
  });

  it("runs the refresh with the authenticated task UID", async () => {
    mocks.authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "task-9" });
    mocks.refreshLeadSearchByTaskUid.mockResolvedValue({ ok: true, searchId: 9, inserted: 2, duplicates: 1, errors: [] });
    await withServer(async (url) => { const response = await fetch(url, { method: "POST" }); expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ searchId: 9, inserted: 2 }); expect(mocks.refreshLeadSearchByTaskUid).toHaveBeenCalledWith("task-9"); });
  });

  it("serializes refresh errors as HTTP 500", async () => {
    mocks.authenticateRequest.mockRejectedValue(new Error("bad cron token"));
    await withServer(async (url) => { const response = await fetch(url, { method: "POST" }); expect(response.status).toBe(500); expect(await response.json()).toMatchObject({ error: "bad cron token" }); });
  });
});
