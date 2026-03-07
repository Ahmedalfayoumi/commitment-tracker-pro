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

// Run every day to check subscription expiry and send reminders
crons.interval(
  "check subscription expiry reminders",
  { hours: 24 },
  internal.companies.sendExpiryReminders,
  {}
);

export default crons;