import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { ROLES } from "./schema";

export const promoteToAdmin = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { role: ROLES.ADMIN });
    
    // Also ensure they are linked to the Master Company as admin
    const masterCompany = await ctx.db
      .query("companies")
      .filter((q) => q.eq(q.field("companyType"), "Master"))
      .first();

    if (masterCompany) {
      const existingLink = await ctx.db
        .query("companyUsers")
        .withIndex("by_companyId_and_userId", (q) =>
          q.eq("companyId", masterCompany._id).eq("userId", user._id)
        )
        .first();

      if (!existingLink) {
        await ctx.db.insert("companyUsers", {
          companyId: masterCompany._id,
          userId: user._id,
          role: "admin",
        });
      } else {
        await ctx.db.patch(existingLink._id, { role: "admin" });
      }
    }

    return { message: `User ${args.username} promoted to admin` };
  },
});
