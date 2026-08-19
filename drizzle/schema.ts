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
