import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCompanyAccounts = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db
      .query("accounts")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("asc")
      .take(500);
  },
});

export const getAllUserAccounts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .unique();
    if (!user) return [];

    const companyUsers = await ctx.db
      .query("companyUsers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100);

    const companyIds = companyUsers.map((cu) => cu.companyId);

    const allAccounts: any[] = [];
    for (const companyId of companyIds) {
      const accounts = await ctx.db
        .query("accounts")
        .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
        .take(500);
      const company = await ctx.db.get(companyId);
      allAccounts.push(...accounts.map((a) => ({ ...a, companyName: company?.nameAr || "" })));
    }
    return allAccounts;
  },
});

export const createAccount = mutation({
  args: {
    name: v.string(),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .unique();
    if (!user) throw new Error("User not found");

    // Check for duplicate
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_companyId_and_name", (q) =>
        q.eq("companyId", args.companyId).eq("name", args.name.trim())
      )
      .unique();
    if (existing) throw new Error("الحساب موجود بالفعل");

    return await ctx.db.insert("accounts", {
      name: args.name.trim(),
      companyId: args.companyId,
      createdBy: user._id,
    });
  },
});

export const updateAccount = mutation({
  args: {
    accountId: v.id("accounts"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");

    // Check for duplicate name in same company
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_companyId_and_name", (q) =>
        q.eq("companyId", account.companyId).eq("name", args.name.trim())
      )
      .unique();
    if (existing && existing._id !== args.accountId) throw new Error("الحساب موجود بالفعل");

    await ctx.db.patch(args.accountId, { name: args.name.trim() });
  },
});

export const deleteAccount = mutation({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.delete(args.accountId);
  },
});
