import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const studioProjects = mysqlTable("studioProjects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  artist: varchar("artist", { length: 180 }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("Briefing"),
  responsible: varchar("responsible", { length: 120 }).notNull().default("Duck"),
  progress: int("progress").notNull().default(0),
  color: varchar("color", { length: 20 }).notNull().default("lime"),
  currentVersion: varchar("currentVersion", { length: 120 }).notNull().default("Ideia inicial"),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const studioEvents = mysqlTable("studioEvents", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  detail: varchar("detail", { length: 255 }).notNull(),
  tone: varchar("tone", { length: 20 }).notNull().default("lime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  clientName: varchar("clientName", { length: 180 }).notNull(),
  service: varchar("service", { length: 80 }).notNull(),
  durationMinutes: int("durationMinutes").notNull().default(180),
  trackCount: int("trackCount").notNull().default(1),
  deadlineDays: int("deadlineDays").notNull().default(7),
  quotedMin: int("quotedMin").notNull(),
  quotedMax: int("quotedMax").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudioProject = typeof studioProjects.$inferSelect;
export type InsertStudioProject = typeof studioProjects.$inferInsert;
export type StudioEvent = typeof studioEvents.$inferSelect;
export type InsertStudioEvent = typeof studioEvents.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

export const ledgerEntries = mysqlTable("ledgerEntries", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId"),
  opportunityId: int("opportunityId"),
  description: varchar("description", { length: 180 }).notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("BRL"),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  dueAt: timestamp("dueAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const royaltySplits = mysqlTable("royaltySplits", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId").notNull(),
  participantName: varchar("participantName", { length: 180 }).notNull(),
  role: varchar("role", { length: 80 }).notNull(),
  percentage: varchar("percentage", { length: 10 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type RoyaltySplit = typeof royaltySplits.$inferSelect;

export const releaseKits = mysqlTable("releaseKits", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId"),
  assetId: int("assetId"),
  title: varchar("title", { length: 180 }).notNull(),
  concept: text("concept"),
  isrc: varchar("isrc", { length: 30 }),
  releaseDate: timestamp("releaseDate"),
  creditsJson: text("creditsJson"),
  linksJson: text("linksJson"),
  deliveryStatus: varchar("deliveryStatus", { length: 40 }).notNull().default("em produção"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReleaseKit = typeof releaseKits.$inferSelect;

export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  channel: varchar("channel", { length: 40 }).notNull(),
  destination: varchar("destination", { length: 255 }),
  enabled: int("enabled").notNull().default(0),
  eventTypes: text("eventTypes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const dawRenders = mysqlTable("dawRenders", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId").notNull(),
  assetId: int("assetId"),
  externalId: varchar("externalId", { length: 180 }).notNull(),
  source: varchar("source", { length: 40 }).notNull().default("ableton"),
  status: varchar("status", { length: 30 }).notNull().default("received"),
  metadataJson: text("metadataJson"),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type DawRender = typeof dawRenders.$inferSelect;

export const audioAssets = mysqlTable("audioAssets", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  versionLabel: varchar("versionLabel", { length: 120 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull().default(0),
  durationSeconds: int("durationSeconds").notNull().default(0),
  bpm: int("bpm"),
  loudnessLufs: varchar("loudnessLufs", { length: 20 }),
  waveformJson: text("waveformJson"),
  checksumSha256: varchar("checksumSha256", { length: 64 }),
  peakDb: varchar("peakDb", { length: 20 }),
  rms: varchar("rms", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const waveformComments = mysqlTable("waveformComments", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  assetId: int("assetId").notNull(),
  timestampSeconds: int("timestampSeconds").notNull(),
  body: varchar("body", { length: 500 }).notNull(),
  resolved: int("resolved").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AudioAsset = typeof audioAssets.$inferSelect;
export type InsertAudioAsset = typeof audioAssets.$inferInsert;
export type WaveformComment = typeof waveformComments.$inferSelect;
export type InsertWaveformComment = typeof waveformComments.$inferInsert;
