// healthServices.ts

import { InValue } from "@libsql/client";
import db from "../db/database";
import {
  generateHealthSignal_langchain,
  generateHealthSignal_ollama,
} from "./llmServices";
import { saveHealthSignal } from "./healthSignalServices";
import { isFullyPrivate } from "../utils";

interface HealthEntry {
  uuid: string;
  [key: string]: unknown;
}

function deduplicateHealthData(data: HealthEntry[]): HealthEntry[] {
  const seen = new Set<string>();
  return data.filter((entry) => {
    return seen.has(entry.uuid) ? false : (seen.add(entry.uuid), true);
  });
}

async function isAlreadyInDb(uuid: string): Promise<boolean> {
  const result = await db.execute({
    sql: `SELECT 1 FROM health_data WHERE uuid = ?`,
    args: [uuid],
  });
  return result.rows.length > 0;
}

export async function saveHealthData({
  data,
  username,
}: {
  data: HealthEntry[];
  username: string;
}) {
  const deduplicated = deduplicateHealthData(data);
  let inserted = 0;
  let skipped = 0;

  const windowSize = 30;
  const contextWindow = await getLastHealthData(windowSize);
  const currentUniqueEntry: HealthEntry[] = [];

  for (const entry of deduplicated) {
    const exists = await isAlreadyInDb(entry.uuid);
    if (exists) {
      skipped++;
      continue;
    }

    console.log(entry);
    currentUniqueEntry.push(entry);

    await db.execute({
      sql: `INSERT OR IGNORE INTO health_data (uuid, username, data) VALUES (?, ?, ?)`,
      args: [entry.uuid, username.toLowerCase(), JSON.stringify(entry)],
    });
    inserted++;
  }

  if (currentUniqueEntry.length > 0) {
    let signal: any;
    if (isFullyPrivate()) {
      signal = await generateHealthSignal_ollama({
        currentEntry: currentUniqueEntry,
        contextWindow,
        windowSize,
      });
    } else {
      signal = await generateHealthSignal_langchain({
        currentEntry: currentUniqueEntry,
        contextWindow,
        windowSize,
      });
    }
    console.log(signal);
    await saveHealthSignal({
      entry: signal as any,
      username: username.toLowerCase(),
    });
  }

  return { inserted, skipped };
}

export async function getAllHealthData(filters?: {
  metric?: string;
  domain?: string;
  from?: string;
  to?: string;
  createdFrom?: string;
  createdTo?: string;
}) {
  let sql = `SELECT * FROM health_data WHERE 1=1`;
  const args: InValue[] = [];

  if (filters?.metric) {
    sql += ` AND json_extract(data, '$.metric') = ?`;
    args.push(filters.metric);
  }
  if (filters?.domain) {
    sql += ` AND json_extract(data, '$.domain') = ?`;
    args.push(filters.domain);
  }
  if (filters?.from) {
    sql += ` AND json_extract(data, '$.interval_start') >= ?`;
    args.push(filters.from);
  }
  if (filters?.to) {
    sql += ` AND json_extract(data, '$.interval_end') <= ?`;
    args.push(filters.to);
  }
  if (filters?.createdFrom) {
    sql += ` AND created_at >= ?`;
    args.push(
      filters.createdFrom.length === 10
        ? `${filters.createdFrom} 00:00:00`
        : filters.createdFrom,
    );
  }
  if (filters?.createdTo) {
    sql += ` AND created_at <= ?`;
    args.push(
      filters.createdTo.length === 10
        ? `${filters.createdTo} 23:59:59`
        : filters.createdTo,
    );
  }

  sql += ` ORDER BY json_extract(data, '$.interval_start') DESC`;
  const result = await db.execute({ sql, args });
  return result.rows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    ...(JSON.parse(row.data as string) as HealthEntry),
  }));
}

export async function getSingleHealthData(id: number) {
  const result = await db.execute({
    sql: `SELECT * FROM health_data WHERE id = ?`,
    args: [id],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    created_at: row.created_at,
    ...(JSON.parse(row.data as string) as HealthEntry),
  };
}

export async function getLastHealthData(limit: number) {
  // Return early if the requested limit is 0 or negative
  if (limit <= 0) return [];

  // Order by id DESC to get the most recently inserted records first,
  // then limit the result set to 'x' elements.
  const result = await db.execute({
    sql: `SELECT * FROM health_data ORDER BY id DESC LIMIT ?`,
    args: [limit],
  });

  // Map the raw database rows back into your standard HealthEntry object format
  return result.rows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    ...(JSON.parse(row.data as string) as HealthEntry),
  }));
}

export async function getHealthDataByUsername(
  username: string,
  filters?: {
    metric?: string;
    domain?: string;
    from?: string;
    to?: string;
    createdFrom?: string;
    createdTo?: string;
  },
) {
  let sql = `SELECT * FROM health_data WHERE username = ?`;
  const args: InValue[] = [username.toLowerCase()];

  if (filters?.metric) {
    sql += ` AND json_extract(data, '$.metric') = ?`;
    args.push(filters.metric);
  }
  if (filters?.domain) {
    sql += ` AND json_extract(data, '$.domain') = ?`;
    args.push(filters.domain);
  }
  if (filters?.from) {
    sql += ` AND json_extract(data, '$.interval_start') >= ?`;
    args.push(filters.from);
  }
  if (filters?.to) {
    sql += ` AND json_extract(data, '$.interval_end') <= ?`;
    args.push(filters.to);
  }
  if (filters?.createdFrom) {
    sql += ` AND created_at >= ?`;
    args.push(
      filters.createdFrom.length === 10
        ? `${filters.createdFrom} 00:00:00`
        : filters.createdFrom,
    );
  }
  if (filters?.createdTo) {
    sql += ` AND created_at <= ?`;
    args.push(
      filters.createdTo.length === 10
        ? `${filters.createdTo} 23:59:59`
        : filters.createdTo,
    );
  }

  sql += ` ORDER BY json_extract(data, '$.interval_start') DESC`;
  const result = await db.execute({ sql, args });
  return result.rows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    ...(JSON.parse(row.data as string) as HealthEntry),
  }));
}
