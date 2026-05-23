export function deduplicateHealthData(data: any) {
  const seen = new Set();
  return data.filter((entry: any) => {
    const key = `${entry.metric}|${entry.interval_start}|${entry.interval_end}|${entry.workout_type ?? ""}`;
    return seen.has(key) ? false : (seen.add(key), true);
  });
}
