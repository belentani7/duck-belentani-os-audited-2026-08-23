import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  createEvent: vi.fn().mockResolvedValue(undefined),
  createAudioAsset: vi.fn().mockResolvedValue(undefined),
  createWaveformComment: vi.fn().mockResolvedValue(undefined),
  createOpportunity: vi.fn().mockResolvedValue(undefined),
  listEvents: vi.fn().mockResolvedValue([]),
  listOpportunities: vi.fn().mockResolvedValue([]),
  listProjects: vi.fn().mockResolvedValue([]),
  listAudioAssets: vi.fn().mockResolvedValue([]),
  listWaveformComments: vi.fn().mockResolvedValue([]),
}));

vi.mock("./db", () => dbMocks);

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
