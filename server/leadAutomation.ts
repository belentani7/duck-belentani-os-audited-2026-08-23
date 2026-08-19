import { claimLeadNotification, createEvent, createLeadRecord, createLeadSource, getLeadSearchByTaskUid, listNotificationPreferences, touchLeadSearch } from "./db";
import { scrapePublicPage } from "./leadScraper";
import { notifyOwner } from "./_core/notification";

type LeadSearch = {
  id: number;
  ownerId: number;
  name: string;
  niche: string;
  area: string;
  variablesJson: string | null;
  sourceUrlsJson: string | null;
};

function parseStringArray(value: string | null) {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function refreshLeadSearch(search: LeadSearch) {
  const variables = parseStringArray(search.variablesJson);
  const sourceUrls = parseStringArray(search.sourceUrlsJson);
  const result = { inserted: 0, duplicates: 0, errors: [] as string[] };

  for (const sourceUrl of sourceUrls) {
    let sourceTitle: string | undefined;
    try {
      const scraped = await scrapePublicPage(sourceUrl, variables);
      sourceTitle = scraped.title;
      await createLeadSource({ ownerId: search.ownerId, searchId: search.id, url: sourceUrl, title: sourceTitle, status: scraped.lead ? "processed" : "no-contact", fetchedAt: new Date() });
      if (!scraped.lead) continue;
      const created = await createLeadRecord({ ownerId: search.ownerId, searchId: search.id, fullName: scraped.lead.fullName, companyName: scraped.lead.companyName, email: scraped.lead.email, phone: scraped.lead.phone, website: scraped.lead.website, area: search.area, niche: search.niche, intentSignal: scraped.lead.intentSignal, sourceUrl, dedupeKey: scraped.lead.dedupeKey, score: scraped.lead.score, status: "novo" });
      if (created.inserted) result.inserted += 1; else result.duplicates += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha desconhecida";
      result.errors.push(`${sourceUrl}: ${message}`);
      await createLeadSource({ ownerId: search.ownerId, searchId: search.id, url: sourceUrl, title: sourceTitle, status: "error", errorMessage: message, fetchedAt: new Date() });
    }
  }

  await touchLeadSearch(search.ownerId, search.id, { inserted: result.inserted, duplicates: result.duplicates, errors: result.errors.length });
  await createEvent({ ownerId: search.ownerId, type: "lead", title: "Atualização automática concluída", detail: `${search.niche} · ${result.inserted} novos leads · ${result.duplicates} duplicados`, tone: "cyan" });
  if (result.inserted > 0 || result.errors.length > 0) {
    const preferences = await listNotificationPreferences(search.ownerId);
    const leadEnabled = preferences.some((preference) => {
      if (!preference.enabled || preference.channel !== "internal") return false;
      try { return JSON.parse(preference.eventTypes || "[]").includes("lead"); } catch { return false; }
    });
    if (leadEnabled && await claimLeadNotification(search.ownerId, search.id)) await notifyOwner({ title: "Radar de leads atualizado", content: `${search.name}: ${result.inserted} novos leads, ${result.duplicates} duplicados e ${result.errors.length} erros.` });
  }
  return result;
}

export async function refreshLeadSearchByTaskUid(taskUid: string) {
  const search = await getLeadSearchByTaskUid(taskUid);
  if (!search) return { ok: true as const, skipped: "orphan" as const };
  return { ok: true as const, searchId: search.id, ...(await refreshLeadSearch(search)) };
}

export function cronErrorPayload(error: unknown, url: string, taskUid?: string | null) {
  return { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, context: { url, taskUid }, timestamp: new Date().toISOString() };
}

export type { LeadSearch };
