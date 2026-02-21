import { query } from "./_generated/server";

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