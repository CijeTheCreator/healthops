import os from "os";

export function deduplicateHealthData(data: any) {
  const seen = new Set();
  return data.filter((entry: any) => {
    const key = `${entry.metric}|${entry.interval_start}|${entry.interval_end}|${entry.workout_type ?? ""}`;
    return seen.has(key) ? false : (seen.add(key), true);
  });
}

export function getLocalIPv4Address() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over non-IPv4 and internal (loopback) addresses
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1"; // Fallback
}
