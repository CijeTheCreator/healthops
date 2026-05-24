import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";

import { configDotenv } from "dotenv";
import { saveHealthData } from "./services/healthServices";
import { initDb } from "./db/database";
import { scheduleWeeklyJob } from "./services/cron";
import {
  genAI_WeeklyDigest,
  ollama_WeeklyDigest,
} from "./services/llmServices";
import {
  collectStreamingPromptResponse_aistudio,
  collectStreamingPromptResponse_ollama,
  Playground,
} from "./services/processUserMessage";
import { getFamilyStats } from "./services/dashboardService";
import { getLocalIPv4Address, isFullyPrivate } from "./utils";
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

//Functions related to run
function hasRunnableInput(playground: Playground | undefined) {
  return Boolean(playground?.prompt?.trim());
}

function writeSse(res: express.Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

const SSE_FINAL_TEXT_LIMIT = 200_000;
const SSE_THOUGHTS_TEXT_LIMIT = 80_000;

app.post("/api/run", async (req, res) => {
  const playground = req.body?.playground as Playground | undefined;
  if (!playground) {
    res.status(400).json({ error: "Prompt or attachment is required" });
    return;
  }
  if (!hasRunnableInput(playground)) {
    res.status(400).json({ error: "Prompt or attachment is required" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();

  let clientConnected = true;
  const heartbeat = setInterval(() => {
    if (!clientConnected || res.destroyed || res.writableEnded) {
      clearInterval(heartbeat);
      return;
    }

    try {
      res.write(": heartbeat\n\n");
    } catch {
      clientConnected = false;
      clearInterval(heartbeat);
    }
  }, 15_000);

  const markClientDisconnected = () => {
    clientConnected = false;
    clearInterval(heartbeat);
  };

  req.on("aborted", markClientDisconnected);
  res.on("close", markClientDisconnected);

  const writeIfConnected = (event: string, data: unknown) => {
    if (!clientConnected || res.destroyed || res.writableEnded) {
      return false;
    }

    try {
      writeSse(res, event, data);
      return true;
    } catch {
      markClientDisconnected();
      return false;
    }
  };

  try {
    const sentChars = {
      final: 0,
      thoughts: 0,
    };
    const writeLimitedDelta = (delta: {
      channel: "thoughts" | "final";
      text: string;
    }) => {
      const limit =
        delta.channel === "final"
          ? SSE_FINAL_TEXT_LIMIT
          : SSE_THOUGHTS_TEXT_LIMIT;
      const remaining = Math.max(0, limit - sentChars[delta.channel]);
      if (remaining <= 0) {
        return;
      }

      const text = delta.text.slice(0, remaining);
      sentChars[delta.channel] += text.length;
      writeIfConnected("delta", { ...delta, text });
    };

    console.log("Playground: ", playground);
    let result: any;
    if (isFullyPrivate()) {
      result = await collectStreamingPromptResponse_ollama({
        playground,
        onStart: (data) => writeIfConnected("start", data),
        onDelta: writeLimitedDelta,
        onError: (message) => writeIfConnected("error", { message }),
      });
    } else {
      result = await collectStreamingPromptResponse_aistudio({
        playground,
        onStart: (data) => writeIfConnected("start", data),
        onDelta: writeLimitedDelta,
        onError: (message) => writeIfConnected("error", { message }),
      });
    }

    writeIfConnected("done", result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeIfConnected("error", { message });
  } finally {
    clearInterval(heartbeat);
    if (clientConnected && !res.destroyed && !res.writableEnded) {
      res.end();
    }
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const stats = await getFamilyStats();
    const ipAddress = getLocalIPv4Address();
    stats["ip"] = ipAddress;
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch family stats" });
  }
});

async function start() {
  await initDb();
  scheduleWeeklyJob("Sunday", 0, 0, async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const formatted = oneWeekAgo.toISOString().split("T")[0];
    if (isFullyPrivate()) {
      ollama_WeeklyDigest({ rangeStart: formatted });
    } else {
      genAI_WeeklyDigest({ rangeStart: formatted });
    }
  });
  app.listen(PORT, () => {
    const ip = getLocalIPv4Address();

    console.log(
      `\n🚀 HealthOps is live!\n\n` +
        `  Dashboard  →  http://${ip}:3000\n` +
        `  Phone IP   →  ${ip}\n`,
    );
  });
}

start();
