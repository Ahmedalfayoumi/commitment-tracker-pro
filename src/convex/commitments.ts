import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a new commitment
export const createCommitment = mutation({
  args: {
    companyId: v.id("companies"),
    dueDate: v.number(),
    account: v.string(),
    description: v.string(),
    amount: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("postponed"),
      v.literal("paid"),
      v.literal("partialPaid"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Verify user has access to company
    const companyUser = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", args.companyId).eq("userId", userId)
      )
      .first();

    if (!companyUser) throw new Error("Unauthorized");

    // Generate commitment number (YYYY-MM-0001 format)
    const now = new Date(args.dueDate);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `${year}-${month}`;

    // Get last commitment number for this month
    const lastCommitment = await ctx.db
      .query("commitments")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("numberPrefix"), prefix))
      .order("desc")
      .first();

    let sequence = 1;
    if (lastCommitment) {
      sequence = lastCommitment.numberSequence + 1;
    }

    const commitmentNumber = `${prefix}-${String(sequence).padStart(4, "0")}`;

    const commitmentId = await ctx.db.insert("commitments", {
      companyId: args.companyId,
      commitmentNumber,
      numberPrefix: prefix,
      numberSequence: sequence,
      dueDate: args.dueDate,
      account: args.account,
      description: args.description,
      amount: args.amount,
      paidAmount: 0,
      status: args.status,
      createdBy: userId,
    });

    return commitmentId;
  },
});

// Get unique months (prefixes) for a company's commitments
export const getCommitmentMonths = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const companyUser = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", args.companyId).eq("userId", userId)
      )
      .first();

    if (!companyUser) return [];

    const commitments = await ctx.db
      .query("commitments")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .take(1000);

    const months = Array.from(new Set(commitments.map((c) => c.numberPrefix))).sort().reverse();
    return months;
  },
});

// Get commitments for a company
export const getCommitments = query({
  args: {
    companyId: v.id("companies"),
    searchQuery: v.optional(v.string()),
    month: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const companyUser = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", args.companyId).eq("userId", userId)
      )
      .first();

    if (!companyUser) return [];

    let q = ctx.db.query("commitments");
    
    if (args.month) {
      q = q.withIndex("by_companyId_and_numberPrefix", (query) => 
        query.eq("companyId", args.companyId).eq("numberPrefix", args.month)
      );
    } else {
      q = q.withIndex("by_companyId", (query) => query.eq("companyId", args.companyId));
    }

    let commitments = await q.order("desc").take(100);

    // Filter by search query
    if (args.searchQuery) {
      const search = args.searchQuery.toLowerCase();
      commitments = commitments.filter(
        (c) =>
          c.commitmentNumber.toLowerCase().includes(search) ||
          c.account.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search)
      );
    }

    return commitments;
  },
});

// Update commitment
export const updateCommitment = mutation({
  args: {
    commitmentId: v.id("commitments"),
    dueDate: v.optional(v.number()),
    account: v.optional(v.string()),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("postponed"),
        v.literal("paid"),
        v.literal("partialPaid"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const commitment = await ctx.db.get(args.commitmentId);
    if (!commitment) throw new Error("Commitment not found");

    const companyUser = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", commitment.companyId).eq("userId", userId)
      )
      .first();

    if (!companyUser) throw new Error("Unauthorized");

    const { commitmentId, ...updates } = args;
    await ctx.db.patch(commitmentId, updates);

    return commitmentId;
  },
});

// Delete commitment
export const deleteCommitment = mutation({
  args: { commitmentId: v.id("commitments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const commitment = await ctx.db.get(args.commitmentId);
    if (!commitment) throw new Error("Commitment not found");

    const companyUser = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", commitment.companyId).eq("userId", userId)
      )
      .first();

    if (!companyUser) throw new Error("Unauthorized");

    await ctx.db.delete(args.commitmentId);
  },
});