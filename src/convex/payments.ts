import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to check if user has a specific permission via position
async function userHasPermission(ctx: any, userId: any, companyId: any, permission: string): Promise<boolean> {
  const currentUser = await ctx.db.get(userId);
  const isSystemAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";
  if (isSystemAdmin) return true;

  const companyUser = await ctx.db
    .query("companyUsers")
    .withIndex("by_companyId_and_userId", (q: any) =>
      q.eq("companyId", companyId).eq("userId", userId)
    )
    .first();

  if (!companyUser) return false;
  if (companyUser.role === "admin") return true;

  // Check position-based permissions
  const userPosition = await ctx.db
    .query("userPositions")
    .withIndex("by_companyId_and_userId", (q: any) =>
      q.eq("companyId", companyId).eq("userId", userId)
    )
    .first();

  if (!userPosition) return false;

  let positionPerms: string[] = [];
  if (userPosition.positionId) {
    const position = await ctx.db.get(userPosition.positionId);
    positionPerms = position?.permissions || [];
  }

  const granted = userPosition.grantedPermissions || [];
  const revoked = userPosition.revokedPermissions || [];
  const effective = new Set([...positionPerms, ...granted]);
  for (const r of revoked) effective.delete(r);

  return effective.has(permission);
}

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

    const canCreate = await userHasPermission(ctx, userId, commitment.companyId, "payments.create");
    if (!canCreate) throw new Error("ليس لديك صلاحية إنشاء المدفوعات");

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

// Update a payment
export const updatePayment = mutation({
  args: {
    paymentId: v.id("payments"),
    amount: v.optional(v.number()),
    paymentMethod: v.optional(v.union(
      v.literal("cash"),
      v.literal("bankTransfer"),
      v.literal("creditCard"),
      v.literal("clique")
    )),
    paymentDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error("Payment not found");

    const canEdit = await userHasPermission(ctx, userId, payment.companyId, "payments.create");
    if (!canEdit) throw new Error("ليس لديك صلاحية تعديل المدفوعات");

    const commitment = await ctx.db.get(payment.commitmentId);
    if (!commitment) throw new Error("Commitment not found");

    // If amount changed, update commitment
    if (args.amount !== undefined && args.amount !== payment.amount) {
      const diff = args.amount - payment.amount;
      const newPaidAmount = commitment.paidAmount + diff;
      
      let newStatus = commitment.status;
      if (newPaidAmount >= commitment.amount) {
        newStatus = "paid";
      } else if (newPaidAmount > 0) {
        newStatus = "partialPaid";
      } else {
        newStatus = "active";
      }

      await ctx.db.patch(payment.commitmentId, {
        paidAmount: newPaidAmount,
        status: newStatus,
      });
    }

    const { paymentId, ...updates } = args;
    await ctx.db.patch(paymentId, updates);

    return paymentId;
  },
});

// Delete a payment
export const deletePayment = mutation({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error("Payment not found");

    const canDelete = await userHasPermission(ctx, userId, payment.companyId, "payments.delete");
    if (!canDelete) throw new Error("ليس لديك صلاحية حذف المدفوعات");

    const commitment = await ctx.db.get(payment.commitmentId);
    if (commitment) {
      const newPaidAmount = Math.max(0, commitment.paidAmount - payment.amount);
      let newStatus = commitment.status;
      
      if (newPaidAmount === 0) {
        newStatus = "active";
      } else if (newPaidAmount < commitment.amount) {
        newStatus = "partialPaid";
      }

      await ctx.db.patch(payment.commitmentId, {
        paidAmount: newPaidAmount,
        status: newStatus,
      });
    }

    await ctx.db.delete(args.paymentId);
    return { success: true };
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

// Get all payments for the current user across all companies
export const getAllUserPayments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const userCompanies = await ctx.db
      .query("companyUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const companyIds = userCompanies.map((cu) => cu.companyId);
    
    let allPayments: any[] = [];
    for (const companyId of companyIds) {
      const payments = await ctx.db
        .query("payments")
        .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
        .collect();
      
      const company = await ctx.db.get(companyId);
      
      for (const payment of payments) {
        const commitment = await ctx.db.get(payment.commitmentId);
        allPayments.push({
          ...payment,
          companyName: company?.nameAr,
          commitmentNumber: commitment?.commitmentNumber,
          commitmentAccount: commitment?.account,
        });
      }
    }

    return allPayments.sort((a, b) => b.paymentDate - a.paymentDate);
  },
});