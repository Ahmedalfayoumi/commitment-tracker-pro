import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a payment
export const createPayment = mutation({
  args: {
    commitmentId: v.id("commitments"),
    amount: v.number(),
    paymentMethod: v.union(
      v.literal("cash"),
      v.literal("bankTransfer"),
      v.literal("creditCard"),
      v.literal("clique")
    ),
    paymentDate: v.number(),
    notes: v.optional(v.string()),
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

    // Create payment
    const paymentId = await ctx.db.insert("payments", {
      commitmentId: args.commitmentId,
      companyId: commitment.companyId,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      paymentDate: args.paymentDate,
      notes: args.notes,
      createdBy: userId,
    });

    // Update commitment paid amount and status
    const newPaidAmount = commitment.paidAmount + args.amount;
    let newStatus = commitment.status;

    if (newPaidAmount >= commitment.amount) {
      newStatus = "paid";
    } else if (newPaidAmount > 0) {
      newStatus = "partialPaid";
    }

    await ctx.db.patch(args.commitmentId, {
      paidAmount: newPaidAmount,
      status: newStatus,
    });

    return paymentId;
  },
});

// Get payments for a commitment
export const getPaymentsByCommitment = query({
  args: { commitmentId: v.id("commitments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const commitment = await ctx.db.get(args.commitmentId);
    if (!commitment) return [];

    const companyUser = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", commitment.companyId).eq("userId", userId)
      )
      .first();

    if (!companyUser) return [];

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_commitmentId", (q) => q.eq("commitmentId", args.commitmentId))
      .order("desc")
      .collect();

    return payments;
  },
});

// Get all payments for a company
export const getPaymentsByCompany = query({
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

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    // Get commitment details for each payment
    const paymentsWithCommitments = await Promise.all(
      payments.map(async (payment) => {
        const commitment = await ctx.db.get(payment.commitmentId);
        return {
          ...payment,
          commitment,
        };
      })
    );

    return paymentsWithCommitments;
  },
});
