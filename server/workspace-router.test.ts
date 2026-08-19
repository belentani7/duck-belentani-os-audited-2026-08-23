import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  createEvent: vi.fn().mockResolvedValue(undefined),
  createAudioAsset: vi.fn().mockResolvedValue(undefined),
  createWaveformComment: vi.fn().mockResolvedValue(undefined),
  createOpportunity: vi.fn().mockResolvedValue(undefined),
  createReleaseKit: vi.fn().mockResolvedValue(undefined),
  updateProject: vi.fn().mockResolvedValue(undefined),
  createDawRender: vi.fn().mockResolvedValue(undefined),
  saveNotificationPreference: vi.fn().mockResolvedValue(undefined),
  listEvents: vi.fn().mockResolvedValue([]),
  listOpportunities: vi.fn().mockResolvedValue([]),
  listProjects: vi.fn().mockResolvedValue([]),
  listAudioAssets: vi.fn().mockResolvedValue([]),
  listWaveformComments: vi.fn().mockResolvedValue([]),
  listLeadSearches: vi.fn().mockResolvedValue([]),
  setLeadSearchSchedule: vi.fn().mockResolvedValue(undefined),
  createLeadSearch: vi.fn().mockResolvedValue([{ insertId: 31 }]),
  listLeadRecords: vi.fn().mockResolvedValue([]),
  createLeadSource: vi.fn().mockResolvedValue(undefined),
  createLeadRecord: vi.fn().mockResolvedValue({ inserted: true }),
  touchLeadSearch: vi.fn().mockResolvedValue(undefined),
  updateLeadRecord: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn().mockResolvedValue("data:application/octet-stream;base64,AAEC"), storagePreparePut: vi.fn() }));
vi.mock("./_core/heartbeat", () => ({ createHeartbeatJob: vi.fn().mockResolvedValue({ taskUid: "task-31", nextExecutionAt: "2026-08-19T12:00:00Z" }), deleteHeartbeatJob: vi.fn().mockResolvedValue(undefined) }));
const scraperMocks = vi.hoisted(() => ({ scrapePublicPage: vi.fn().mockResolvedValue({ title: "Fonte pública", lead: { companyName: "Estúdio Recife", email: "contato@estudio.com", phone: "+5581999990000", website: "https://estudio.com", intentSignal: "contratar", score: 85, dedupeKey: "contato@estudio.com||estudio.com" } }) }));
vi.mock("./leadScraper", () => scraperMocks);

const { appRouter } = await import("./routers");

const context = (user: { id: number; role: "user" | "admin" } | null) => ({
  req: {} as never,
  res: {} as never,
  user,
});

describe("workspace router", () => {
  beforeEach(() => { vi.clearAllMocks(); scraperMocks.scrapePublicPage.mockResolvedValue({ title: "Fonte pública", lead: { companyName: "Estúdio Recife", email: "contato@estudio.com", phone: "+5581999990000", website: "https://estudio.com", intentSignal: "contratar", score: 85, dedupeKey: "contato@estudio.com||estudio.com" } }); });

  it("salva um briefing e registra o evento de receita", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    const result = await caller.workspace.createOpportunity({
      clientName: "Cliente Aracaju",
      service: "Mix + master",
      durationMinutes: 180,
      trackCount: 4,
      deadlineDays: 7,
    });

    expect(result.min).toBeGreaterThan(0);
    expect(dbMocks.createOpportunity).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, clientName: "Cliente Aracaju", quotedMin: result.min, quotedMax: result.max }));
    expect(dbMocks.createEvent).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, type: "money" }));
  });

  it("bloqueia dashboard sem autenticação", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.workspace.dashboard()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("bloqueia criação de briefing sem autenticação", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.workspace.createOpportunity({
      clientName: "Tentativa sem sessão",
      service: "Mix + master",
      durationMinutes: 180,
      trackCount: 1,
      deadlineDays: 7,
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("registra render DAW e evento operacional", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    await caller.workspace.ingestDawRender({ projectId: 9, assetId: 42, externalId: "ableton-2026-08-19-01", source: "ableton", metadataJson: '{"bpm":128}' });
    expect(dbMocks.createDawRender).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, projectId: 9, assetId: 42, source: "ableton" }));
    expect(dbMocks.createEvent).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, type: "render" }));
  });

  it("salva preferência de canal de notificação", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    await caller.workspace.saveNotificationPreference({ channel: "telegram", destination: "@duck_prod", enabled: true, eventTypes: ["render"] });
    expect(dbMocks.saveNotificationPreference).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, channel: "telegram", enabled: 1, destination: "@duck_prod" }));
  });

  it("atualiza estado, progresso e responsável do projeto", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    await caller.workspace.updateProject({ projectId: 9, status: "Aguardando aprovação", progress: 85, responsible: "Lucas Silva" });
    expect(dbMocks.updateProject).toHaveBeenCalledWith(7, 9, expect.objectContaining({ status: "Aguardando aprovação", progress: 85, responsible: "Lucas Silva" }));
  });

  it("salva ficha com créditos, links, status e ISRC", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    await caller.workspace.saveReleaseKit({ projectId: 9, assetId: 42, title: "Lançamento Aracaju", concept: "Noite e mar", isrc: "BR-AAA-26-00001", releaseDate: "2026-09-01", creditsJson: "Duck — produção", linksJson: "https://example.com", deliveryStatus: "aguardando aprovação" });
    expect(dbMocks.createReleaseKit).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, projectId: 9, assetId: 42, creditsJson: "Duck — produção", linksJson: "https://example.com", deliveryStatus: "aguardando aprovação", isrc: "BR-AAA-26-00001", releaseDate: new Date("2026-09-01") }));
  });

  it("registra asset com análise persistida e duração", async () => {
    const bytes = new Uint8Array([0, 1, 2]);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const checksumSha256 = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    await caller.workspace.registerAudioAsset({ projectId: 9, fileName: "render.wav", storageKey: "audio/render.wav", mimeType: "audio/wav", fileSize: 3, checksumSha256, peakDb: "-1.2", rms: "0.42", versionLabel: "render · v1", durationSeconds: 12, waveformJson: "[10,80,100]" });
    expect(dbMocks.createAudioAsset).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, projectId: 9, durationSeconds: 12, peakDb: "-1.2", rms: "0.42", waveformJson: "[10,80,100]" }));
  });

  it("consulta assets pelo projeto correto", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    await caller.workspace.audioAssets({ projectId: 9 });
    expect(dbMocks.listAudioAssets).toHaveBeenCalledWith(7, 9);
  });

  it("cria comentário vinculado ao asset correto", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    await caller.workspace.createWaveformComment({ assetId: 42, timestampSeconds: 73, body: "Subir o synth" });
    expect(dbMocks.createWaveformComment).toHaveBeenCalledWith({ ownerId: 7, assetId: 42, timestampSeconds: 73, body: "Subir o synth" });
  });

  it("consulta comentários pelo asset correto", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    await caller.workspace.waveformComments({ assetId: 42 });
    expect(dbMocks.listWaveformComments).toHaveBeenCalledWith(7, 42);
  });

  it("cria uma busca, persiste lead e registra a execução", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    const result = await caller.workspace.createLeadSearch({ name: "Radar Recife", niche: "Música", area: "Recife", variables: ["contratar", "mixagem"], sourceUrls: ["https://estudio.com/servicos"] });
    expect(result.searchId).toBe(31);
    expect(result.inserted).toBe(1);
    expect(dbMocks.createLeadSearch).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, niche: "Música", area: "Recife" }));
    expect(dbMocks.createLeadRecord).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, searchId: 31, email: "contato@estudio.com", score: 85 }));
    expect(dbMocks.touchLeadSearch).toHaveBeenCalledWith(7, 31, { inserted: 1, duplicates: 0, errors: 0 });
  });

  it("ativa e pausa o refresh periódico da busca do proprietário", async () => {
    dbMocks.listLeadSearches.mockResolvedValueOnce([{ id: 31, ownerId: 7, name: "Radar", niche: "Música", area: "Recife", scheduleCronTaskUid: null }]);
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    const active = await caller.workspace.scheduleLeadRefresh({ searchId: 31, cron: "0 */6 * * * *" });
    expect(active.taskUid).toBe("task-31");
    expect(dbMocks.setLeadSearchSchedule).toHaveBeenCalledWith(7, 31, "task-31");
    dbMocks.listLeadSearches.mockResolvedValueOnce([{ id: 31, ownerId: 7, name: "Radar", niche: "Música", area: "Recife", scheduleCronTaskUid: "task-31" }]);
    await caller.workspace.disableLeadRefresh({ searchId: 31 });
    expect(dbMocks.setLeadSearchSchedule).toHaveBeenCalledWith(7, 31, null);
  });

  it("persiste fonte sem contato e ainda registra evento agregado", async () => {
    scraperMocks.scrapePublicPage.mockResolvedValueOnce({ title: "Página editorial" });
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    const result = await caller.workspace.createLeadSearch({ name: "Radar editorial", niche: "Música", area: "Recife", variables: ["contratar"], sourceUrls: ["https://editorial.com"] });
    expect(result.inserted).toBe(0);
    expect(dbMocks.createLeadSource).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, searchId: 31, status: "no-contact", title: "Página editorial" }));
    expect(dbMocks.createEvent).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, type: "lead", detail: expect.stringContaining("0 novos leads") }));
  });

  it("persiste erro da fonte e retorna o erro agregado sem interromper a busca", async () => {
    scraperMocks.scrapePublicPage.mockRejectedValueOnce(new Error("Fonte bloqueou a requisição"));
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    const result = await caller.workspace.createLeadSearch({ name: "Radar com erro", niche: "Música", area: "Recife", variables: ["contratar"], sourceUrls: ["https://bloqueado.com"] });
    expect(result.errors).toEqual(["https://bloqueado.com: Fonte bloqueou a requisição"]);
    expect(dbMocks.createLeadSource).toHaveBeenCalledWith(expect.objectContaining({ status: "error", errorMessage: "Fonte bloqueou a requisição" }));
  });

  it("contabiliza lead duplicado sem inserir um novo registro", async () => {
    dbMocks.createLeadRecord.mockResolvedValueOnce({ inserted: false, id: 77 });
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    const result = await caller.workspace.createLeadSearch({ name: "Radar duplicado", niche: "Música", area: "Recife", variables: ["contratar"], sourceUrls: ["https://estudio.com/servicos"] });
    expect(result.inserted).toBe(0);
    expect(result.duplicates).toBe(1);
  });

  it("bloqueia criação de busca sem autenticação", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.workspace.createLeadSearch({ name: "Radar", niche: "Música", area: "Recife", variables: ["contratar"], sourceUrls: ["https://estudio.com"] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("atualiza status e notas de um lead do proprietário", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    await caller.workspace.updateLead({ leadId: 44, status: "contactar", notes: "Revisar portfólio" });
    expect(dbMocks.updateLeadRecord).toHaveBeenCalledWith(7, 44, { status: "contactar", notes: "Revisar portfólio", score: undefined });
  });

  it("bloqueia leitura de leads sem autenticação", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.workspace.leads()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("bloqueia a rota administrativa para usuário comum", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    await expect(caller.system.notifyOwner({ title: "Teste", content: "Não enviar" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
