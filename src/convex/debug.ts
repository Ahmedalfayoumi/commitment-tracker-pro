import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAdminStatus = query({
  args: {},
  handler: async (ctx) => {
    const adminUser = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", "admin"))
      .first();

    if (!adminUser) {
      return { error: "Admin user not found in 'users' table" };
    }

    const adminAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", adminUser._id).eq("provider", "password")
      )
      .first();

    const accountByIdentifier = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", "admin")
      )
      .first();

    return {
      user: {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
      },
      accountByUserId: adminAccount ? {
        id: adminAccount._id,
        providerAccountId: adminAccount.providerAccountId,
        hasSecret: !!adminAccount.secret,
      } : null,
      accountByIdentifier: accountByIdentifier ? {
        id: accountByIdentifier._id,
        userId: accountByIdentifier.userId,
        providerAccountId: accountByIdentifier.providerAccountId,
      } : null,
    };
  },
});