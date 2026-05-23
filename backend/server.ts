import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";

import { configDotenv } from "dotenv";
import { deduplicateHealthData } from "./utils";
import { saveHealthData } from "./services/healthServices";
import { initDb } from "./db/database";
import { success } from "zod";
import { scheduleWeeklyJob } from "./services/cron";
import { genAI_WeeklyDigest } from "./services/llmServices";
configDotenv({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get("/api/health", async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log(error);
    res.status(503).json({
      success: false,
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/consume", async (req: Request, res: Response) => {
  try {
    const { data, username } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "Expected { data: [...] }" });
    }

    const result = await saveHealthData({ data, username });
    res.json({ success: true, ...result });
    console.log(`${result} received from ${username}`);
  } catch (error) {
    console.log(error);
    res.status(503).json({
      success: false,
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

async function start() {
  await initDb();
  scheduleWeeklyJob("Sunday", 0, 0, async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const formatted = oneWeekAgo.toISOString().split("T")[0];
    genAI_WeeklyDigest({ rangeStart: formatted });
  });
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();
