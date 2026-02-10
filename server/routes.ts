import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export async function registerRoutes(app: Express): Promise<Server> {

  app.get("/api/health", async (_req, res) => {
    try {
      const posts = await storage.getAnalysisPosts("free");
      res.json({ status: "ok", postCount: posts.length, timestamp: Date.now() });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: err?.message });
    }
  });

  app.get("/api/posts/:channel", async (req, res) => {
    try {
      const posts = await storage.getAnalysisPosts(req.params.channel);
      res.json(posts);
    } catch (err) {
      console.error("Error getting posts:", err);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const { title, content, category, channel, imageUri } = req.body;
      const post = await storage.createAnalysisPost({
        id: generateId(),
        title,
        content,
        category: category || "general",
        channel: channel || "free",
        imageUri: imageUri || null,
        timestamp: Date.now(),
      });
      res.json(post);
    } catch (err) {
      console.error("Error creating post:", err);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      await storage.deleteAnalysisPost(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting post:", err);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  app.get("/api/chat/:channel", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.channel);
      res.json(messages);
    } catch (err) {
      console.error("Error getting chat:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { username, text, channel, isAdmin, isModerator } = req.body;
      const msg = await storage.createChatMessage({
        id: generateId(),
        username,
        text,
        channel,
        isAdmin: isAdmin || false,
        isModerator: isModerator || false,
        timestamp: Date.now(),
      });
      res.json(msg);
    } catch (err) {
      console.error("Error creating message:", err);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.delete("/api/chat/:id", async (req, res) => {
    try {
      await storage.deleteChatMessage(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting message:", err);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  app.get("/api/education", async (_req, res) => {
    try {
      const posts = await storage.getEducationPosts();
      res.json(posts);
    } catch (err) {
      console.error("Error getting education:", err);
      res.status(500).json({ error: "Failed to fetch education posts" });
    }
  });

  app.post("/api/education", async (req, res) => {
    try {
      const { title, content } = req.body;
      const post = await storage.createEducationPost({
        id: generateId(),
        title,
        content,
        timestamp: Date.now(),
      });
      res.json(post);
    } catch (err) {
      console.error("Error creating education post:", err);
      res.status(500).json({ error: "Failed to create education post" });
    }
  });

  app.delete("/api/education/:id", async (req, res) => {
    try {
      await storage.deleteEducationPost(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting education post:", err);
      res.status(500).json({ error: "Failed to delete education post" });
    }
  });

  app.get("/api/moderators", async (_req, res) => {
    try {
      const mods = await storage.getModerators();
      res.json(mods);
    } catch (err) {
      console.error("Error getting moderators:", err);
      res.status(500).json({ error: "Failed to fetch moderators" });
    }
  });

  app.post("/api/moderators", async (req, res) => {
    try {
      const { username } = req.body;
      const mod = await storage.addModerator({
        id: generateId(),
        username: username.trim(),
        addedAt: Date.now(),
      });
      res.json(mod);
    } catch (err) {
      console.error("Error adding moderator:", err);
      res.status(500).json({ error: "Failed to add moderator" });
    }
  });

  app.delete("/api/moderators/:id", async (req, res) => {
    try {
      await storage.removeModerator(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Error removing moderator:", err);
      res.status(500).json({ error: "Failed to remove moderator" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
