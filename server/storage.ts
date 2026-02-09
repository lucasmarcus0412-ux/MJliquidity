import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import {
  type User,
  type InsertUser,
  type AnalysisPost,
  type ChatMessage,
  type EducationPost,
  type Moderator,
  users,
  analysisPosts,
  chatMessages,
  educationPosts,
  moderators,
} from "@shared/schema";

const db = drizzle(process.env.DATABASE_URL!);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAnalysisPosts(channel: string): Promise<AnalysisPost[]>;
  createAnalysisPost(post: AnalysisPost): Promise<AnalysisPost>;
  deleteAnalysisPost(id: string): Promise<void>;

  getChatMessages(channel: string): Promise<ChatMessage[]>;
  createChatMessage(msg: ChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: string): Promise<void>;

  getEducationPosts(): Promise<EducationPost[]>;
  createEducationPost(post: EducationPost): Promise<EducationPost>;
  deleteEducationPost(id: string): Promise<void>;

  getModerators(): Promise<Moderator[]>;
  addModerator(mod: Moderator): Promise<Moderator>;
  removeModerator(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAnalysisPosts(channel: string): Promise<AnalysisPost[]> {
    return db.select().from(analysisPosts).where(eq(analysisPosts.channel, channel)).orderBy(desc(analysisPosts.timestamp));
  }

  async createAnalysisPost(post: AnalysisPost): Promise<AnalysisPost> {
    const [created] = await db.insert(analysisPosts).values(post).returning();
    return created;
  }

  async deleteAnalysisPost(id: string): Promise<void> {
    await db.delete(analysisPosts).where(eq(analysisPosts.id, id));
  }

  async getChatMessages(channel: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(eq(chatMessages.channel, channel)).orderBy(chatMessages.timestamp);
  }

  async createChatMessage(msg: ChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(msg).returning();
    return created;
  }

  async deleteChatMessage(id: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.id, id));
  }

  async getEducationPosts(): Promise<EducationPost[]> {
    return db.select().from(educationPosts).orderBy(desc(educationPosts.timestamp));
  }

  async createEducationPost(post: EducationPost): Promise<EducationPost> {
    const [created] = await db.insert(educationPosts).values(post).returning();
    return created;
  }

  async deleteEducationPost(id: string): Promise<void> {
    await db.delete(educationPosts).where(eq(educationPosts.id, id));
  }

  async getModerators(): Promise<Moderator[]> {
    return db.select().from(moderators);
  }

  async addModerator(mod: Moderator): Promise<Moderator> {
    const [created] = await db.insert(moderators).values(mod).returning();
    return created;
  }

  async removeModerator(id: string): Promise<void> {
    await db.delete(moderators).where(eq(moderators.id, id));
  }
}

export const storage = new DatabaseStorage();
