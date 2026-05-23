export interface HealthEntry {
  id: number;
  uuid: string;
  created_at: string;
  metric: string;
  domain: string;
  interval_start: string;
  interval_end: string;
  [key: string]: unknown;
}

export type SignalLevel = "normal" | "watch" | "alert";

export interface HealthSignal {
  id: number;
  created_at: string;
  signal: SignalLevel;
  observation: string;
  timestamp: string;
  username: string;
}

export interface WeeklyDigest {
  id: number;
  username: string;
  body: string;
  created_at: string;
}

export interface FamilyStats {
  ip: string;
  totalMembers: number;
  members: string[];
  totalHealthEntries: number;
  healthEntries: HealthEntry[];
  totalHealthSignals: number;
  healthSignals: HealthSignal[];
  totalWeeklyDigests: number;
  weeklyDigests: WeeklyDigest[];
}
