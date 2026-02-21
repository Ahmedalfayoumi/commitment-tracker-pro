import { getAuthUserId } from "@convex-dev/auth/server";
import { query, QueryCtx, mutation, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Password } from "@convex-dev/auth/providers/Password";
import { internal } from "./_generated/api";

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

export const hashAndSavePassword = internalAction({
  args: { userId: v.id("users"), password: v.string() },
  handler: async (ctx, args) => {
    const hashedPassword = await Password.hash(args.password);
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