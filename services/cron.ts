import cron from "node-cron";

type DayOfWeek =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

const dayMap: Record<DayOfWeek, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export function scheduleWeeklyJob(
  day: DayOfWeek,
  hour: number = 0,
  minute: number = 0,
  weeklyTask: () => Promise<void>,
) {
  const dayNumber = dayMap[day];

  // Build the cron string: "minute hour * * dayNumber"
  const cronExpression = `${minute} ${hour} * * ${dayNumber}`;

  console.log(
    `Scheduling job to run every ${day} at ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} (Cron: ${cronExpression})`,
  );

  cron.schedule(cronExpression, () => {
    weeklyTask();
  });
}
