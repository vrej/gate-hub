import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { apiRouter } from "./api-routes";
import { setupAuth } from "./auth";
import path from "path";
import { fileURLToPath } from "url";

// Node 18 compatibility - get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from root public folder (for images, etc.)
  const rootPublicPath = path.resolve(__dirname, "..", "public");
  app.use("/images", express.static(path.join(rootPublicPath, "images")));
  
  // Setup authentication routes FIRST (before other routes)
  setupAuth(app);
  
  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  
  // Register all API routes from api-routes.ts
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}