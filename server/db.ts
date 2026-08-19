import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertOpportunity, opportunities, studioEvents, studioProjects, users, audioAssets, waveformComments, InsertAudioAsset, InsertWaveformComment } from "../drizzle/schema";
import { ENV } from './_core/env';

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
  return db.select().from(audioAssets).where(and(eq(audioAssets.ownerId, ownerId), eq(audioAssets.projectId, projectId))).orderBy(desc(audioAssets.createdAt)).limit(50);
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
