import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, bigint, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const analysisPosts = pgTable("analysis_posts", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  channel: text("channel").notNull().default("free"),
  imageUri: text("image_uri"),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull(),
  text: text("text").notNull(),
  channel: text("channel").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  isModerator: boolean("is_moderator").default(false),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
});

export const educationPosts = pgTable("education_posts", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").notNull().default("article"),
  imageUri: text("image_uri"),
  linkUrl: text("link_url"),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
});

export const moderators = pgTable("moderators", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull(),
  addedAt: bigint("added_at", { mode: "number" }).notNull(),
});

export const bannedUsers = pgTable("banned_users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull(),
  reason: text("reason"),
  bannedBy: text("banned_by").notNull(),
  bannedAt: bigint("banned_at", { mode: "number" }).notNull(),
});

export const reportedMessages = pgTable("reported_messages", {
  id: varchar("id").primaryKey(),
  messageId: text("message_id").notNull(),
  reportedBy: text("reported_by").notNull(),
  reason: text("reason"),
  channel: text("channel").notNull(),
  reportedAt: bigint("reported_at", { mode: "number" }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AnalysisPost = typeof analysisPosts.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type EducationPost = typeof educationPosts.$inferSelect;
export type Moderator = typeof moderators.$inferSelect;
export type BannedUser = typeof bannedUsers.$inferSelect;
export type ReportedMessage = typeof reportedMessages.$inferSelect;
