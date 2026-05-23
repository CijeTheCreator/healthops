import { InValue } from "@libsql/client";
import db from "../db/database";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignalLevel = "normal" | "watch" | "alert";

export interface HealthSignalEntry {
  signal: SignalLevel;
  observation: string;
  timestamp: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function rowToSignal(row: unknown) {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as number,
    created_at: r.created_at as string,
    signal: r.signal as SignalLevel,
    username: r.username as string,
    observation: r.observation as string,
    timestamp: new Date(r.timestamp as string),
  };
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function saveHealthSignal({
  entry,
  username,
}: {
  entry: HealthSignalEntry;
  username: string;
}): Promise<number> {
  const result = await db.execute({
    sql: `
      INSERT INTO health_signals (signal, username, observation, timestamp, data)
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [
      entry.signal,
      username.toLowerCase(),
      entry.observation,
      entry.timestamp.toISOString(),
      JSON.stringify(entry),
    ],
  });

  return Number(result.lastInsertRowid);
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getAllHealthSignals(filters?: {
  signal?: SignalLevel;
  from?: string;
  to?: string;
  createdFrom?: string;
  createdTo?: string;
}) {
  let sql = `SELECT * FROM health_signals WHERE 1=1`;
  const args: InValue[] = [];

  if (filters?.signal) {
    sql += ` AND signal = ?`;
    args.push(filters.signal);
  }
  if (filters?.from) {
    sql += ` AND timestamp >= ?`;
    args.push(filters.from);
  }
  if (filters?.to) {
    sql += ` AND timestamp <= ?`;
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

  sql += ` ORDER BY timestamp DESC`;
  const result = await db.execute({ sql, args });
  return result.rows.map(rowToSignal);
}

export async function getSingleHealthSignal(id: number) {
  const result = await db.execute({
    sql: `SELECT * FROM health_signals WHERE id = ?`,
    args: [id],
  });

  if (result.rows.length === 0) return null;
  return rowToSignal(result.rows[0]);
}

export async function getLastHealthSignals(limit: number) {
  if (limit <= 0) return [];

  const result = await db.execute({
    sql: `SELECT * FROM health_signals ORDER BY id DESC LIMIT ?`,
    args: [limit],
  });

  return result.rows.map(rowToSignal);
}

export async function getHealthSignalsByLevel(signal: SignalLevel) {
  const result = await db.execute({
    sql: `SELECT * FROM health_signals WHERE signal = ? ORDER BY timestamp DESC`,
    args: [signal],
  });

  return result.rows.map(rowToSignal);
}

export async function getHealthSignalsByUsername(
  username: string,
  filters?: {
    signal?: SignalLevel;
    from?: string;
    to?: string;
    createdFrom?: string;
    createdTo?: string;
  },
) {
  let sql = `SELECT * FROM health_signals WHERE username = ?`;
  const args: InValue[] = [username.toLowerCase()];

  if (filters?.signal) {
    sql += ` AND signal = ?`;
    args.push(filters.signal);
  }
  if (filters?.from) {
    sql += ` AND timestamp >= ?`;
    args.push(filters.from);
  }
  if (filters?.to) {
    sql += ` AND timestamp <= ?`;
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

  sql += ` ORDER BY timestamp DESC`;
  const result = await db.execute({ sql, args });
  return result.rows.map(rowToSignal);
}
