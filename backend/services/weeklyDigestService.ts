import db from "../db/database";

interface WeeklyDigest {
  id?: number;
  username: string;
  body: string;
  created_at?: string;
}

// SETTERS

export async function saveWeeklyDigest(
  username: string,
  body: string,
): Promise<void> {
  await db.execute({
    sql: `INSERT OR IGNORE INTO weekly_digests (username, body) VALUES (?, ?)`,
    args: [username, body],
  });
}

// GETTERS

export async function getAllWeeklyDigests(): Promise<WeeklyDigest[]> {
  const result = await db.execute(
    `SELECT * FROM weekly_digests ORDER BY created_at DESC`,
  );
  return result.rows.map((row) => ({
    id: row.id as number,
    username: row.username as string,
    body: row.body as string,
    created_at: row.created_at as string,
  }));
}

export async function getLastWeeklyDigest(
  username: string,
): Promise<WeeklyDigest | null> {
  const result = await db.execute({
    sql: `SELECT * FROM weekly_digests WHERE username = ?`,
    args: [username],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id as number,
    username: row.username as string,
    body: row.body as string,
    created_at: row.created_at as string,
  };
}

export async function getWeeklyDigestsByUsername(
  username: string,
): Promise<WeeklyDigest[]> {
  const result = await db.execute({
    sql: `SELECT * FROM weekly_digests WHERE username = ? ORDER BY created_at DESC`,
    args: [username],
  });
  return result.rows.map((row) => ({
    id: row.id as number,
    username: row.username as string,
    body: row.body as string,
    created_at: row.created_at as string,
  }));
}

export async function getLatestWeeklyDigest(): Promise<WeeklyDigest | null> {
  const result = await db.execute(
    `SELECT * FROM weekly_digests ORDER BY created_at DESC LIMIT 1`,
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id as number,
    username: row.username as string,
    body: row.body as string,
    created_at: row.created_at as string,
  };
}
