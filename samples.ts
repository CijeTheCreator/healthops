const sampleCurrentEntryNormal = [
  {
    id: 67,
    type: "TOTAL_CALORIES_BURNED",
    unit: "KILOCALORIE",
    value: { __type: "NumericHealthValue", numericValue: 53.7 },
    dateFrom: "2026-05-21T06:01:42.970",
    dateTo: "2026-05-21T06:07:05.156",
    sourcePlatform: "googleHealthConnect",
    sourceName: "com.google.android.apps.fitness",
    recordingMethod: "unknown",
  },
];

const sampleCurrentEntryWatch = [
  {
    id: 60,
    type: "TOTAL_CALORIES_BURNED",
    unit: "KILOCALORIE",
    value: { __type: "NumericHealthValue", numericValue: 48.2 },
    dateFrom: "2026-05-21T00:00:00.000",
    dateTo: "2026-05-21T05:28:12.221",
    sourcePlatform: "googleHealthConnect",
    sourceName: "com.google.android.apps.fitness",
    recordingMethod: "unknown",
  },
];

const sampleCurrentEntryAlert = [
  {
    id: 99,
    type: "HEART_RATE",
    unit: "BEATS_PER_MINUTE",
    value: { __type: "NumericHealthValue", numericValue: 178 },
    dateFrom: "2026-05-21T06:37:00.000",
    dateTo: "2026-05-21T06:37:59.000",
    sourcePlatform: "googleHealthConnect",
    sourceName: "com.google.android.apps.fitness",
    recordingMethod: "automatic",
  },
];

export const samples = {
  normal: sampleCurrentEntryNormal,
  watch: sampleCurrentEntryWatch,
  alert: sampleCurrentEntryAlert,
};
