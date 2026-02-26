import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { BASE_URL } from "../client/lib/endpoint";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from the public directory
  app.use(express.static(path.join(__dirname, "../public")));

  // Proxy API routes to backend
  app.get("/api/role", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const response = await fetch(`${BASE_URL}/api/role`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  return app;
}
