// database.ts

import { createClient } from "@libsql/client";
import path from "path";

const db = createClient({
  url: `file:${path.join(process.cwd(), "health.db")}`,
});

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS health_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      data JSON NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
  CREATE TABLE IF NOT EXISTS health_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    signal TEXT NOT NULL CHECK(signal IN ('normal', 'watch', 'alert')),
    username TEXT NOT NULL,
    observation TEXT NOT NULL,
    data JSON NOT NULL,
    timestamp DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

  await db.execute(`
  CREATE TABLE IF NOT EXISTS weekly_digests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
}

export default db;
