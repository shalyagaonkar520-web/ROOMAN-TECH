import express from "express";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import apiRoutes from "./src/server/routes";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.use("/api", apiRoutes);
  app.use("/api", (req, res, next) => { res.status(404).json({ error: "API route not found" }); });
  app.use("/api", (err, req, res, next) => { console.error("API Error:", err); res.status(err.status || 500).json({ error: err.message || "Internal Server Error" }); });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
