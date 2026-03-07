import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every day at noon to generate due date notifications
crons.interval(
  "generate due date notifications",
  { hours: 24 },
  internal.notifications.generateDueNotifications,
  {}
);

export default crons;
