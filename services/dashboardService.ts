import db from "../db/database";
import { rowToSignal } from "./healthSignalServices";

export async function getFamilyStats() {
  const [membersResult, signalsResult, digestsResult, healthEntriesResult] =
    await Promise.all([
      db.execute(`SELECT DISTINCT username FROM health_data`),
      db.execute(`SELECT * FROM health_signals ORDER BY timestamp DESC`),
      db.execute(`SELECT * FROM weekly_digests ORDER BY created_at DESC`),
      db.execute(`SELECT * FROM health_data ORDER BY id DESC`),
    ]);

  const members = membersResult.rows.map((row) => row.username as string);

  const healthEntries = healthEntriesResult.rows.map((row) => ({
    id: row.id as number,
    created_at: row.created_at as string,
    ...JSON.parse(row.data as string),
  }));

  const healthSignals = signalsResult.rows.map(rowToSignal);

  const weeklyDigests = digestsResult.rows.map((row) => ({
    id: row.id as number,
    username: row.username as string,
    body: row.body as string,
    created_at: row.created_at as string,
  }));

  return {
    totalMembers: members.length,
    members,
    totalHealthEntries: healthEntries.length,
    // healthEntries,
    totalHealthSignals: healthSignals.length,
    healthSignals,
    totalWeeklyDigests: weeklyDigests.length,
    weeklyDigests,
  };
}
