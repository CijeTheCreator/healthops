import os from "os";
import { configDotenv } from "dotenv";
configDotenv({ quiet: true });

export function deduplicateHealthData(data: any) {
  const seen = new Set();
  return data.filter((entry: any) => {
    const key = `${entry.metric}|${entry.interval_start}|${entry.interval_end}|${entry.workout_type ?? ""}`;
    return seen.has(key) ? false : (seen.add(key), true);
  });
}

export function getLocalIPv4Address(): { ip: string; reachable: boolean } {
  if (process.env.HOST_IP) {
    return { ip: process.env.HOST_IP, reachable: true };
  }

  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        return { ip: iface.address, reachable: false };
      }
    }
  }

  return { ip: "127.0.0.1", reachable: false };
}

export function isFullyPrivate() {
  return false;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (GEMINI_API_KEY) {
    return false;
  } else {
    return true;
  }
}
