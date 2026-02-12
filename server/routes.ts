import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import * as fs from "fs";
import * as path from "path";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export async function registerRoutes(app: Express): Promise<Server> {

  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

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
      if (!isAdmin) {
        const banned = await storage.isUserBanned(username);
        if (banned) {
          return res.status(403).json({ error: "You have been banned from chat." });
        }
      }
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
      const { title, content, contentType, imageData, linkUrl } = req.body;

      let imageUri: string | null = null;
      if (imageData) {
        const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
          const uploadsDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          fs.writeFileSync(path.join(uploadsDir, filename), buffer);
          imageUri = `/uploads/${filename}`;
        }
      }

      const post = await storage.createEducationPost({
        id: generateId(),
        title,
        content,
        contentType: contentType || 'article',
        imageUri,
        linkUrl: linkUrl || null,
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

  app.get("/api/banned", async (_req, res) => {
    try {
      const banned = await storage.getBannedUsers();
      res.json(banned);
    } catch (err) {
      console.error("Error getting banned users:", err);
      res.status(500).json({ error: "Failed to fetch banned users" });
    }
  });

  app.get("/api/banned/check/:username", async (req, res) => {
    try {
      const isBanned = await storage.isUserBanned(req.params.username);
      res.json({ banned: isBanned });
    } catch (err) {
      console.error("Error checking ban status:", err);
      res.status(500).json({ error: "Failed to check ban status" });
    }
  });

  app.post("/api/banned", async (req, res) => {
    try {
      const { username, reason, bannedBy } = req.body;
      const ban = await storage.banUser({
        id: generateId(),
        username: username.trim(),
        reason: reason || null,
        bannedBy: bannedBy || "Admin",
        bannedAt: Date.now(),
      });
      res.json(ban);
    } catch (err) {
      console.error("Error banning user:", err);
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  app.delete("/api/banned/:id", async (req, res) => {
    try {
      await storage.unbanUser(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Error unbanning user:", err);
      res.status(500).json({ error: "Failed to unban user" });
    }
  });

  app.post("/api/upload", async (req, res) => {
    try {
      const { imageData, mimeType } = req.body;
      if (!imageData) {
        return res.status(400).json({ error: "No image data provided" });
      }

      const uploadsDir = path.resolve(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const ext = (mimeType || "image/jpeg").split("/")[1] || "jpg";
      const filename = `${generateId()}.${ext}`;
      const filePath = path.join(uploadsDir, filename);

      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

      const imageUrl = `/uploads/${filename}`;
      res.json({ url: imageUrl });
    } catch (err) {
      console.error("Error uploading image:", err);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
