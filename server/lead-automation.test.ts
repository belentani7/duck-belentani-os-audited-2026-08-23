import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claimLeadNotification: vi.fn(),
  listNotificationPreferences: vi.fn(),
  createEvent: vi.fn(),
  createLeadRecord: vi.fn(),
  createLeadSource: vi.fn(),
  getLeadSearchByTaskUid: vi.fn(),
  touchLeadSearch: vi.fn(),
  scrapePublicPage: vi.fn(),
  notifyOwner: vi.fn(),
}));

vi.mock("./db", () => mocks);
vi.mock("./leadScraper", () => ({ scrapePublicPage: mocks.scrapePublicPage }));
vi.mock("./_core/notification", () => ({ notifyOwner: mocks.notifyOwner }));

const { refreshLeadSearch, cronErrorPayload } = await import("./leadAutomation");

describe("lead automation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.scrapePublicPage.mockResolvedValue({ title: "Fonte", lead: { fullName: "Equipe", companyName: "Empresa", email: "contato@empresa.com", phone: "+5511999999999", website: "https://empresa.com", intentSignal: "contratar", dedupeKey: "contato@empresa.com||empresa.com", score: 80 } });
    mocks.createLeadSource.mockResolvedValue(undefined);
    mocks.createLeadRecord.mockResolvedValue({ inserted: true });
    mocks.touchLeadSearch.mockResolvedValue(undefined);
    mocks.createEvent.mockResolvedValue(undefined);
  });

  it("não notifica quando o evento lead não está habilitado", async () => {
    mocks.listNotificationPreferences.mockResolvedValue([{ channel: "internal", enabled: 1, eventTypes: JSON.stringify(["render"]) }]);
    mocks.claimLeadNotification.mockResolvedValue(true);
    const result = await refreshLeadSearch({ id: 1, ownerId: 7, name: "Radar", niche: "Música", area: "Recife", variablesJson: "[]", sourceUrlsJson: JSON.stringify(["https://empresa.com"]) });
    expect(result.inserted).toBe(1);
    expect(mocks.notifyOwner).not.toHaveBeenCalled();
  });

  it("notifica apenas quando há preferência lead e o cooldown foi conquistado", async () => {
    mocks.listNotificationPreferences.mockResolvedValue([{ channel: "internal", enabled: 1, eventTypes: JSON.stringify(["lead"]) }]);
    mocks.claimLeadNotification.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const search = { id: 2, ownerId: 7, name: "Radar", niche: "Música", area: "Recife", variablesJson: "[]", sourceUrlsJson: JSON.stringify(["https://empresa.com"]) };
    await refreshLeadSearch(search);
    await refreshLeadSearch(search);
    expect(mocks.notifyOwner).toHaveBeenCalledTimes(1);
    expect(mocks.claimLeadNotification).toHaveBeenCalledWith(7, 2);
  });

  it("gera payload seguro para falhas cron", () => {
    const payload = cronErrorPayload(new Error("falhou"), "/api/scheduled/refreshLeads", "task-1");
    expect(payload).toMatchObject({ error: "falhou", context: { taskUid: "task-1" } });
  });
});
