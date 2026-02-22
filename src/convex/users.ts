import { getAuthUserId } from "@convex-dev/auth/server";
import { query, QueryCtx, mutation, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Password } from "@convex-dev/auth/providers/Password";
import { internal } from "./_generated/api";
import { ROLES } from "./schema";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();
  },
});

export const changePassword = mutation({
  args: {
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // We need to hash the password, which requires a Node action
    await ctx.scheduler.runAfter(0, internal.users.hashAndSavePassword, {
      userId,
      password: args.newPassword,
    });

    return { success: true };
  },
});

export const adminResetPassword = mutation({
  args: {
    userId: v.id("users"),
    newPassword: v.string(),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Unauthorized");

    const currentUser = await ctx.db.get(currentUserId);
    const isSystemAdmin = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.SUPERADMIN;

    let isCompanyAdmin = false;
    if (args.companyId) {
      const companyUser = await ctx.db
        .query("companyUsers")
        .withIndex("by_companyId_and_userId", (q) =>
          q.eq("companyId", args.companyId!).eq("userId", currentUserId)
        )
        .first();
      isCompanyAdmin = companyUser?.role === "admin";
    }

    if (!isSystemAdmin && !isCompanyAdmin) {
      throw new Error("Only system admins or company admins can reset passwords");
    }

    await ctx.scheduler.runAfter(0, internal.users.hashAndSavePassword, {
      userId: args.userId,
      password: args.newPassword,
    });

    return { success: true };
  },
});

export const hashAndSavePassword = internalAction({
  args: { userId: v.id("users"), password: v.string() },
  handler: async (ctx, args) => {
    const passwordConfig = Password() as any;
    const hashedPassword = await passwordConfig.crypto.hashSecret(args.password);
    await ctx.runMutation(internal.users.updatePasswordAccount, {
      userId: args.userId,
      hashedPassword,
    });
  },
});

export const updatePasswordAccount = internalMutation({
  args: { userId: v.id("users"), hashedPassword: v.string() },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", args.userId).eq("provider", "password")
      )
      .first();

    if (!account) {
      throw new Error("Password account not found");
    }

    await ctx.db.patch(account._id, {
      secret: args.hashedPassword,
    });
  },
});

export const deleteUser = mutation({
  args: { 
    userId: v.id("users"), 
    companyId: v.optional(v.id("companies")) 
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Unauthorized");

    const currentUser = await ctx.db.get(currentUserId);
    const isSystemAdmin = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.SUPERADMIN;

    let isCompanyAdmin = false;
    if (args.companyId) {
      const companyUser = await ctx.db
        .query("companyUsers")
        .withIndex("by_companyId_and_userId", (q) =>
          q.eq("companyId", args.companyId!).eq("userId", currentUserId)
        )
        .first();
      isCompanyAdmin = companyUser?.role === "admin";
    }

    if (!isSystemAdmin && !isCompanyAdmin) {
      throw new Error("Only system admins or company admins can delete users");
    }

    // If company admin, they can only delete users who are in their company
    if (!isSystemAdmin && isCompanyAdmin && args.companyId) {
      const targetInCompany = await ctx.db
        .query("companyUsers")
        .withIndex("by_companyId_and_userId", (q) =>
          q.eq("companyId", args.companyId!).eq("userId", args.userId)
        )
        .first();
      if (!targetInCompany) {
        throw new Error("User not found in your company");
      }
    }

    // Delete all company links for this user
    const companyLinks = await ctx.db
      .query("companyUsers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const link of companyLinks) {
      await ctx.db.delete(link._id);
    }

    // Delete auth accounts
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }

    // Finally delete the user
    await ctx.db.delete(args.userId);

    return { success: true };
  },
});