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
}));

vi.mock("./db", () => dbMocks);
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn().mockResolvedValue("data:application/octet-stream;base64,AAEC"), storagePreparePut: vi.fn() }));

const { appRouter } = await import("./routers");

const context = (user: { id: number; role: "user" | "admin" } | null) => ({
  req: {} as never,
  res: {} as never,
  user,
});

describe("workspace router", () => {
  beforeEach(() => vi.clearAllMocks());

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

  it("bloqueia a rota administrativa para usuário comum", async () => {
    const caller = appRouter.createCaller(context({ id: 7, role: "user" }));
    await expect(caller.system.notifyOwner({ title: "Teste", content: "Não enviar" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
