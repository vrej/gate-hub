import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { apiRouter } from "./api-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  
  // Register all API routes from api-routes.ts
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}