import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { createAudioAsset, createDawRender, createEvent, createOpportunity, createWaveformComment, createLedgerEntry, createReleaseKit, createRoyaltySplit, listAudioAssets, listDawRenders, listEvents, listLedgerEntries, listNotificationPreferences, listOpportunities, listProjects, listReleaseKits, listRoyaltySplits, listWaveformComments, saveNotificationPreference, updateProject, updateProjectStatus, listLeadSearches, createLeadSearch, listLeadRecords, createLeadSource, createLeadRecord, touchLeadSearch, updateLeadRecord } from "./db";
import { storageGetSignedUrl, storagePreparePut } from "./storage";
import { calculateQuote, formatQuoteRange, type ServiceType } from "../shared/quote";
import { z } from "zod";
import { scrapePublicPage } from "./leadScraper";

export const opportunityInput = z.object({
  clientName: z.string().trim().min(2).max(180),
  service: z.enum(["Mix + master", "Produção de beat", "Direção vocal", "Consultoria de lançamento"]),
  durationMinutes: z.number().int().min(30).max(1440),
  trackCount: z.number().int().min(1).max(200),
  deadlineDays: z.number().int().min(1).max(90),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  workspace: router({
    audioAssets: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(({ ctx, input }) => listAudioAssets(ctx.user.id, input.projectId)),
    waveformComments: protectedProcedure.input(z.object({ assetId: z.number().int().positive() })).query(({ ctx, input }) => listWaveformComments(ctx.user.id, input.assetId)),
    createWaveformComment: protectedProcedure.input(z.object({ assetId: z.number().int().positive(), timestampSeconds: z.number().int().min(0), body: z.string().trim().min(2).max(500) })).mutation(async ({ ctx, input }) => {
      await createWaveformComment({ ...input, ownerId: ctx.user.id });
      return { success: true } as const;
    }),
    notificationPreferences: protectedProcedure.query(({ ctx }) => listNotificationPreferences(ctx.user.id)),
    saveNotificationPreference: protectedProcedure.input(z.object({ channel: z.enum(["internal", "telegram", "whatsapp"]), destination: z.string().max(255).optional(), enabled: z.boolean(), eventTypes: z.array(z.string().max(40)).max(20) })).mutation(async ({ ctx, input }) => { await saveNotificationPreference({ ...input, ownerId: ctx.user.id, enabled: input.enabled ? 1 : 0, eventTypes: JSON.stringify(input.eventTypes) }); return { success: true } as const; }),
    dawRenders: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(({ ctx, input }) => listDawRenders(ctx.user.id, input.projectId)),
    ingestDawRender: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), assetId: z.number().int().positive().optional(), externalId: z.string().min(2).max(180), source: z.enum(["ableton", "fl-studio", "logic", "other"]), metadataJson: z.string().max(10000).optional() })).mutation(async ({ ctx, input }) => { await createDawRender({ ...input, ownerId: ctx.user.id }); await createEvent({ ownerId: ctx.user.id, type: "render", title: "Render recebido via DAW Bridge", detail: `${input.source} · ${input.externalId}`, tone: "cyan" }); return { success: true } as const; }),
    prepareAudioUpload: protectedProcedure.input(z.object({ fileName: z.string().min(1).max(255), mimeType: z.string().min(1).max(100) })).mutation(({ ctx, input }) => storagePreparePut(`audio/${ctx.user.id}/${Date.now()}-${input.fileName}`)),
    registerAudioAsset: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), fileName: z.string().min(1).max(255), storageKey: z.string().min(1).max(500), mimeType: z.string().min(1).max(100), fileSize: z.number().int().nonnegative(), checksumSha256: z.string().length(64), peakDb: z.string().max(20).optional(), rms: z.string().max(20).optional(), versionLabel: z.string().min(1).max(120), durationSeconds: z.number().int().nonnegative().default(0), bpm: z.number().int().positive().optional(), loudnessLufs: z.string().max(20).optional(), waveformJson: z.string().max(100000).optional() })).mutation(async ({ ctx, input }) => { const signedUrl = await storageGetSignedUrl(input.storageKey); const storedResponse = await fetch(signedUrl); if (!storedResponse.ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível verificar o arquivo armazenado." }); const storedBytes = await storedResponse.arrayBuffer(); const digest = await crypto.subtle.digest("SHA-256", storedBytes); const storedChecksum = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); if (storedChecksum !== input.checksumSha256) throw new TRPCError({ code: "BAD_REQUEST", message: "A integridade do upload não foi confirmada." }); await createAudioAsset({ ...input, ownerId: ctx.user.id }); return { success: true } as const; }),
    getAudioDownloadUrl: protectedProcedure.input(z.object({ storageKey: z.string().min(1).max(500) })).query(({ input }) => storageGetSignedUrl(input.storageKey)),
    releaseKits: protectedProcedure.query(({ ctx }) => listReleaseKits(ctx.user.id)),
    saveReleaseKit: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), assetId: z.number().int().positive().optional(), title: z.string().min(2).max(180), concept: z.string().max(2000).optional(), isrc: z.string().max(30).optional(), releaseDate: z.string().optional(), creditsJson: z.string().max(10000).optional(), linksJson: z.string().max(10000).optional(), deliveryStatus: z.enum(["briefing", "em produção", "aguardando aprovação", "entregue"]).default("em produção") })).mutation(async ({ ctx, input }) => { await createReleaseKit({ ...input, ownerId: ctx.user.id, releaseDate: input.releaseDate ? new Date(input.releaseDate) : undefined }); return { success: true } as const; }),
    financeSummary: protectedProcedure.query(async ({ ctx }) => { const [ledger, royalties] = await Promise.all([listLedgerEntries(ctx.user.id), listRoyaltySplits(ctx.user.id)]); return { ledger, royalties, pendingCents: ledger.filter((entry) => entry.status !== "paid").reduce((sum, entry) => sum + entry.amountCents, 0), paidCents: ledger.filter((entry) => entry.status === "paid").reduce((sum, entry) => sum + entry.amountCents, 0) }; }),
    createRoyaltySplit: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), participantName: z.string().min(2).max(180), role: z.string().min(2).max(80), percentage: z.string().regex(/^\\d+(\\.\\d+)?$/).max(10) })).mutation(async ({ ctx, input }) => { await createRoyaltySplit({ ...input, ownerId: ctx.user.id }); return { success: true } as const; }),
    createLedgerEntry: protectedProcedure.input(z.object({ description: z.string().min(2).max(180), amountCents: z.number().int().positive(), status: z.enum(["pending", "paid"]).default("pending") })).mutation(async ({ ctx, input }) => { await createLedgerEntry({ ...input, ownerId: ctx.user.id }); return { success: true } as const; }),
    updateProject: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), status: z.string().min(2).max(40).optional(), progress: z.number().int().min(0).max(100).optional(), responsible: z.string().min(2).max(120).optional() })).mutation(async ({ ctx, input }) => { await updateProject(ctx.user.id, input.projectId, input); return { success: true } as const; }),
    approveProjectVersion: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await updateProjectStatus(ctx.user.id, input.projectId, "Aprovado pelo cliente"); await createEvent({ ownerId: ctx.user.id, type: "client", title: "Versão aprovada", detail: `O cliente aprovou o projeto ${input.projectId}.`, tone: "lime" }); return { success: true } as const; }),
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      const [projects, events, opportunities] = await Promise.all([
        listProjects(ctx.user.id),
        listEvents(ctx.user.id),
        listOpportunities(ctx.user.id),
      ]);
      const pipeline = opportunities.filter((item) => item.status !== "closed").reduce((sum, item) => sum + item.quotedMax, 0);
      const timeRecoveredMinutes = events.length * 35 + opportunities.length * 10;
      const automationHealth = Math.min(99, projects.length + events.length + opportunities.length > 0 ? 82 + Math.min(17, events.length * 3 + opportunities.length * 2) : 0);
      const nextSteps = [
        ...opportunities.filter((item) => item.status === "new").slice(0, 2).map((item) => ({ title: `Responder ${item.clientName}`, detail: `${item.service} · briefing aguardando retorno`, tone: "cyan" })),
        ...projects.filter((project) => project.status === "Em revisão" || project.status === "Mixagem").slice(0, 2).map((project) => ({ title: `Continuar ${project.name}`, detail: `${project.currentVersion} · ${project.progress}% concluído`, tone: "lime" })),
      ].slice(0, 3);
      return {
        projects,
        events,
        opportunities,
        nextSteps,
        metrics: {
          pipeline,
          activeProjects: projects.length,
          inProduction: projects.filter((project) => project.status !== "Briefing").length,
          timeRecoveredMinutes,
          automationHealth,
        },
      };
    }),
    createOpportunity: protectedProcedure.input(opportunityInput).mutation(async ({ ctx, input }) => {
      const quote = calculateQuote(input.service as ServiceType, input.durationMinutes, input.trackCount, input.deadlineDays);
      await createOpportunity({ ...input, ownerId: ctx.user.id, quotedMin: quote.min, quotedMax: quote.max });
      await createEvent({ ownerId: ctx.user.id, type: "money", title: "Novo briefing salvo", detail: `${input.clientName} · ${formatQuoteRange(quote.min, quote.max)}`, tone: "amber" });
      return { ...quote, range: formatQuoteRange(quote.min, quote.max) };
    }),
    leadSearches: protectedProcedure.query(({ ctx }) => listLeadSearches(ctx.user.id)),
    leads: protectedProcedure.input(z.object({ searchId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => listLeadRecords(ctx.user.id, input?.searchId)),
    createLeadSearch: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), niche: z.string().trim().min(2).max(120), area: z.string().trim().min(2).max(180), variables: z.array(z.string().trim().min(1).max(80)).max(20), sourceUrls: z.array(z.string().url().max(1000)).min(1).max(10) })).mutation(async ({ ctx, input }) => {
      const result = await createLeadSearch({ ownerId: ctx.user.id, name: input.name, niche: input.niche, area: input.area, variablesJson: JSON.stringify(input.variables), sourceUrlsJson: JSON.stringify(input.sourceUrls), active: 1 });
      const searchId = Number((result as any)?.[0]?.insertId ?? (result as any)?.insertId);
      if (!searchId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível criar a busca." });
      const scan = { inserted: 0, duplicates: 0, errors: [] as string[] };
      for (const sourceUrl of input.sourceUrls) {
        let sourceTitle: string | undefined;
        try {
          const scraped = await scrapePublicPage(sourceUrl, input.variables);
          sourceTitle = scraped.title;
          await createLeadSource({ ownerId: ctx.user.id, searchId, url: sourceUrl, title: sourceTitle, status: scraped.lead ? "processed" : "no-contact", fetchedAt: new Date() });
          if (scraped.lead) {
            const created = await createLeadRecord({ ownerId: ctx.user.id, searchId, fullName: scraped.lead.fullName, companyName: scraped.lead.companyName, email: scraped.lead.email, phone: scraped.lead.phone, website: scraped.lead.website, area: input.area, niche: input.niche, intentSignal: scraped.lead.intentSignal, sourceUrl, dedupeKey: scraped.lead.dedupeKey, score: scraped.lead.score, status: "novo" });
            if (created.inserted) scan.inserted += 1; else scan.duplicates += 1;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Falha desconhecida";
          scan.errors.push(`${sourceUrl}: ${message}`);
          await createLeadSource({ ownerId: ctx.user.id, searchId, url: sourceUrl, title: sourceTitle, status: "error", errorMessage: message, fetchedAt: new Date() });
        }
      }
      await touchLeadSearch(ctx.user.id, searchId, { inserted: scan.inserted, duplicates: scan.duplicates, errors: scan.errors.length });
      await createEvent({ ownerId: ctx.user.id, type: "lead", title: "Busca de potenciais clientes concluída", detail: `${input.niche} · ${scan.inserted} novos leads`, tone: "cyan" });
      return { searchId, ...scan };
    }),
    updateLead: protectedProcedure.input(z.object({ leadId: z.number().int().positive(), status: z.enum(["novo", "revisar", "contactar", "respondeu", "qualificado", "descartado", "convertido"]), notes: z.string().max(2000).optional(), score: z.number().int().min(0).max(100).optional() })).mutation(async ({ ctx, input }) => { await updateLeadRecord(ctx.user.id, input.leadId, { status: input.status, notes: input.notes, score: input.score }); return { success: true } as const; }),
  }),
});

export type AppRouter = typeof appRouter;
