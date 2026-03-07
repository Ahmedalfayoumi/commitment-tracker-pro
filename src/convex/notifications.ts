import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get notifications for current user
export const getUserNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    // Enrich with commitment details
    const enriched = await Promise.all(
      notifications.map(async (n) => {
        const commitment = await ctx.db.get(n.commitmentId);
        const company = await ctx.db.get(n.companyId);
        return {
          ...n,
          commitmentNumber: commitment?.commitmentNumber,
          commitmentAccount: commitment?.account,
          companyName: company?.nameAr,
        };
      })
    );

    return enriched;
  },
});

// Get unread count
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_isRead", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
      .take(100);

    return unread.length;
  },
});

// Mark notification as read
export const markAsRead = internalMutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

// Mark all as read (public mutation)
export const markAllAsRead = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_isRead", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .take(100);

    await Promise.all(unread.map((n) => ctx.db.patch(n._id, { isRead: true })));
  },
});

// Generate notifications for upcoming commitments (called by cron)
export const generateDueNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    // Set to noon (12:00 PM)
    const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const day1Start = new Date(todayStart.getTime() + 1 * 24 * 60 * 60 * 1000);
    const day1End = new Date(todayEnd.getTime() + 1 * 24 * 60 * 60 * 1000);
    const day2Start = new Date(todayStart.getTime() + 2 * 24 * 60 * 60 * 1000);
    const day2End = new Date(todayEnd.getTime() + 2 * 24 * 60 * 60 * 1000);
    const day3Start = new Date(todayStart.getTime() + 3 * 24 * 60 * 60 * 1000);
    const day3End = new Date(todayEnd.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Get all active/partialPaid commitments
    const activeCommitments = await ctx.db
      .query("commitments")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(500);

    const partialCommitments = await ctx.db
      .query("commitments")
      .withIndex("by_status", (q) => q.eq("status", "partialPaid"))
      .take(500);

    const allCommitments = [...activeCommitments, ...partialCommitments];

    for (const commitment of allCommitments) {
      const dueDate = commitment.dueDate;

      let notifType: "due_3days" | "due_2days" | "due_1day" | "due_today" | null = null;
      let message = "";

      if (dueDate >= todayStart.getTime() && dueDate <= todayEnd.getTime()) {
        notifType = "due_today";
        message = `الالتزام ${commitment.commitmentNumber} - ${commitment.account} مستحق اليوم!`;
      } else if (dueDate >= day1Start.getTime() && dueDate <= day1End.getTime()) {
        notifType = "due_1day";
        message = `الالتزام ${commitment.commitmentNumber} - ${commitment.account} مستحق غداً`;
      } else if (dueDate >= day2Start.getTime() && dueDate <= day2End.getTime()) {
        notifType = "due_2days";
        message = `الالتزام ${commitment.commitmentNumber} - ${commitment.account} مستحق بعد يومين`;
      } else if (dueDate >= day3Start.getTime() && dueDate <= day3End.getTime()) {
        notifType = "due_3days";
        message = `الالتزام ${commitment.commitmentNumber} - ${commitment.account} مستحق بعد 3 أيام`;
      }

      if (!notifType) continue;

      // Check if notification already exists for this commitment + type
      const existing = await ctx.db
        .query("notifications")
        .withIndex("by_commitmentId_and_type", (q) =>
          q.eq("commitmentId", commitment._id).eq("type", notifType!)
        )
        .first();

      if (existing) continue;

      // Get all users for this company
      const companyUsers = await ctx.db
        .query("companyUsers")
        .withIndex("by_companyId", (q) => q.eq("companyId", commitment.companyId))
        .take(100);

      for (const cu of companyUsers) {
        await ctx.db.insert("notifications", {
          userId: cu.userId,
          commitmentId: commitment._id,
          companyId: commitment.companyId,
          type: notifType!,
          isRead: false,
          message,
          dueDate: commitment.dueDate,
        });
      }
    }
  },
});

// Public mutation to mark a single notification as read
export const markNotificationRead = internalMutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});
