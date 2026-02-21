import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const checkSuperadmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", "admin"))
      .first();
    
    if (!user) return { status: "User not found" };

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
      .collect();

    return {
      user,
      accounts: accounts.map(a => ({
        id: a._id,
        provider: a.provider,
        providerAccountId: a.providerAccountId,
      }))
    };
  },
});

export const cleanupInvalidAuthAccounts = mutation({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const accounts = await ctx.db.query("authAccounts").take(args.limit);
    let deletedCount = 0;
    for (const account of accounts) {
      // @ts-ignore - we know it might be invalid according to schema
      if (!account.userId || account.userId === "") {
        await ctx.db.delete(account._id);
        deletedCount++;
      }
    }
    return { deletedCount };
  },
});

export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});