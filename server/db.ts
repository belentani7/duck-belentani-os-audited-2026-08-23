import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertOpportunity, opportunities, studioEvents, studioProjects, users, audioAssets, waveformComments, InsertAudioAsset, InsertWaveformComment, ledgerEntries, royaltySplits, releaseKits, notificationPreferences, dawRenders, leadSearches, leadSources, leadRecords, InsertLeadSearch, InsertLeadRecord } from "../drizzle/schema";
import { ENV } from './_core/env';
import { filterAssetsForProject } from "../shared/audio-version";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listNotificationPreferences(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(notificationPreferences).where(eq(notificationPreferences.ownerId, ownerId)).orderBy(desc(notificationPreferences.updatedAt)).limit(20); }
export async function saveNotificationPreference(input: typeof notificationPreferences.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); return db.insert(notificationPreferences).values(input); }
export async function createDawRender(input: typeof dawRenders.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); return db.insert(dawRenders).values(input); }
export async function listDawRenders(ownerId: number, projectId: number) { const db = await getDb(); if (!db) return []; return db.select().from(dawRenders).where(and(eq(dawRenders.ownerId, ownerId), eq(dawRenders.projectId, projectId))).orderBy(desc(dawRenders.receivedAt)).limit(50); }

export async function listReleaseKits(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(releaseKits).where(eq(releaseKits.ownerId, ownerId)).orderBy(desc(releaseKits.updatedAt)).limit(20); }
export async function createReleaseKit(input: typeof releaseKits.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); return db.insert(releaseKits).values(input); }

export async function listLedgerEntries(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(ledgerEntries).where(eq(ledgerEntries.ownerId, ownerId)).orderBy(desc(ledgerEntries.createdAt)).limit(50); }
export async function listRoyaltySplits(ownerId: number, projectId?: number) { const db = await getDb(); if (!db) return []; return db.select().from(royaltySplits).where(eq(royaltySplits.ownerId, ownerId)).orderBy(desc(royaltySplits.createdAt)).limit(100); }
export async function createLedgerEntry(input: typeof ledgerEntries.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); return db.insert(ledgerEntries).values(input); }
export async function createRoyaltySplit(input: typeof royaltySplits.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); return db.insert(royaltySplits).values(input); }

export async function updateProject(ownerId: number, projectId: number, input: { status?: string; progress?: number; responsible?: string }) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); return db.update(studioProjects).set({ ...input, lastActivityAt: new Date() }).where(and(eq(studioProjects.ownerId, ownerId), eq(studioProjects.id, projectId))); }

export async function updateProjectStatus(ownerId: number, projectId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.update(studioProjects).set({ status, lastActivityAt: new Date() }).where(and(eq(studioProjects.ownerId, ownerId), eq(studioProjects.id, projectId)));
}

export async function listProjects(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studioProjects).where(eq(studioProjects.ownerId, ownerId)).orderBy(desc(studioProjects.lastActivityAt)).limit(20);
}

export async function listEvents(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studioEvents).where(eq(studioEvents.ownerId, ownerId)).orderBy(desc(studioEvents.createdAt)).limit(10);
}

export async function listOpportunities(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opportunities).where(eq(opportunities.ownerId, ownerId)).orderBy(desc(opportunities.createdAt)).limit(20);
}

export async function listAudioAssets(ownerId: number, projectId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(audioAssets).where(eq(audioAssets.ownerId, ownerId)).orderBy(desc(audioAssets.createdAt)).limit(50);
  return filterAssetsForProject(rows, projectId);
}

export async function listWaveformComments(ownerId: number, assetId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(waveformComments).where(eq(waveformComments.ownerId, ownerId)).orderBy(desc(waveformComments.timestampSeconds)).limit(100);
}

export async function createAudioAsset(input: InsertAudioAsset) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.insert(audioAssets).values(input);
}

export async function createWaveformComment(input: InsertWaveformComment) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.insert(waveformComments).values(input);
}

export async function createEvent(input: typeof studioEvents.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.insert(studioEvents).values(input);
}

export async function createOpportunity(input: Omit<InsertOpportunity, "ownerId"> & { ownerId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(opportunities).values(input);
  return result;
}

export async function listLeadSearches(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadSearches).where(eq(leadSearches.ownerId, ownerId)).orderBy(desc(leadSearches.createdAt)).limit(50);
}

export async function getLeadSearchByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(leadSearches).where(eq(leadSearches.scheduleCronTaskUid, taskUid)).limit(1);
  return rows[0];
}

export async function setLeadSearchSchedule(ownerId: number, searchId: number, taskUid: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.update(leadSearches).set({ scheduleCronTaskUid: taskUid }).where(and(eq(leadSearches.ownerId, ownerId), eq(leadSearches.id, searchId)));
}

export async function createLeadSearch(input: Omit<InsertLeadSearch, "ownerId"> & { ownerId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.insert(leadSearches).values(input);
}

export async function claimLeadNotification(ownerId: number, searchId: number, cooldownMinutes = 360) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ lastNotifiedAt: leadSearches.lastNotifiedAt }).from(leadSearches).where(and(eq(leadSearches.ownerId, ownerId), eq(leadSearches.id, searchId))).limit(1);
  const lastNotifiedAt = rows[0]?.lastNotifiedAt;
  if (lastNotifiedAt && Date.now() - new Date(lastNotifiedAt).getTime() < cooldownMinutes * 60_000) return false;
  await db.update(leadSearches).set({ lastNotifiedAt: new Date() }).where(and(eq(leadSearches.ownerId, ownerId), eq(leadSearches.id, searchId)));
  return true;
}

export async function touchLeadSearch(ownerId: number, searchId: number, counts: { inserted: number; duplicates: number; errors: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.update(leadSearches).set({ lastRunAt: new Date(), lastInsertedCount: counts.inserted, lastDuplicateCount: counts.duplicates, lastErrorCount: counts.errors }).where(and(eq(leadSearches.ownerId, ownerId), eq(leadSearches.id, searchId)));
}

export async function listLeadRecords(ownerId: number, searchId?: number) {
  const db = await getDb();
  if (!db) return [];
  const filters = searchId ? and(eq(leadRecords.ownerId, ownerId), eq(leadRecords.searchId, searchId)) : eq(leadRecords.ownerId, ownerId);
  return db.select().from(leadRecords).where(filters).orderBy(desc(leadRecords.score), desc(leadRecords.discoveredAt)).limit(500);
}

export async function createLeadSource(input: typeof leadSources.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(leadSources).values(input);
  return result;
}

export async function createLeadRecord(input: InsertLeadRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ id: leadRecords.id }).from(leadRecords).where(and(eq(leadRecords.ownerId, input.ownerId), eq(leadRecords.dedupeKey, input.dedupeKey))).limit(1);
  if (existing.length > 0) return { inserted: false, id: existing[0].id };
  const result = await db.insert(leadRecords).values(input);
  return { inserted: true, result };
}

export async function updateLeadRecord(ownerId: number, leadId: number, input: { status?: string; notes?: string; score?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.update(leadRecords).set(input).where(and(eq(leadRecords.ownerId, ownerId), eq(leadRecords.id, leadId)));
}
