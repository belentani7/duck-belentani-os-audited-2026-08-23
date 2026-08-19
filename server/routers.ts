import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createEvent, createOpportunity, listEvents, listOpportunities, listProjects } from "./db";
import { calculateQuote, formatQuoteRange, type ServiceType } from "../shared/quote";
import { z } from "zod";

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
  }),
});

export type AppRouter = typeof appRouter;
