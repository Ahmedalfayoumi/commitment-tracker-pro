import { internalMutation, mutation, action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { ROLES } from "./schema";
import { Password } from "@convex-dev/auth/providers/Password";
import { internal } from "./_generated/api";

export const seedSuperAdmin = action({
  args: {},
  handler: async (ctx) => {
    const passwordConfig = Password() as any;
    const hashedPassword = await passwordConfig.crypto.hashSecret("admin");
    await ctx.runMutation(internal.seed.finishSeedSuperAdmin, { hashedPassword });
  },
});

export const finishSeedSuperAdmin = internalMutation({
  args: { hashedPassword: v.string() },
  handler: async (ctx, args) => {
    // 1. Check if admin already exists in users table
    const existingUser = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", "admin"))
      .first();

    let userId;
    if (existingUser) {
      userId = existingUser._id;
      // Update existing user role just in case
      await ctx.db.patch(userId, { role: ROLES.ADMIN });
    } else {
      // 2. Create Admin User
      userId = await ctx.db.insert("users", {
        name: "System Admin",
        username: "admin",
        email: "admin@commitmenttracker.pro",
        role: ROLES.ADMIN,
      });
    }

    // 3. Create or Update Password account for the admin
    const existingAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => 
        q.eq("userId", userId).eq("provider", "password")
      )
      .first();

    if (existingAccount) {
      await ctx.db.patch(existingAccount._id, {
        secret: args.hashedPassword,
        providerAccountId: "admin",
      });
    } else {
      await ctx.db.insert("authAccounts", {
        userId,
        provider: "password",
        providerAccountId: "admin",
        secret: args.hashedPassword,
      });
    }

    // 4. Create Master Company if it doesn't exist
    let company = await ctx.db
      .query("companies")
      .filter((q) => q.eq(q.field("companyType"), "Master"))
      .first();

    let companyId;
    if (!company) {
      companyId = await ctx.db.insert("companies", {
        nameAr: "الشركة الرئيسية",
        nameEn: "Master Company",
        companyType: "Master",
        sectors: ["Management"],
        country: "Jordan",
        city: "Amman",
        street: "Main St",
        phone: "0000000000",
        signatoryName: "Super Admin",
        signatoryPhone: "0000000000",
        ownerId: userId,
        isActive: true,
        primaryColor: "#1e293b",
        secondaryColor: "#3b82f6",
      });
    } else {
      companyId = company._id;
    }

    // 5. Link User to Company
    const existingLink = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", companyId).eq("userId", userId)
      )
      .first();

    if (!existingLink) {
      await ctx.db.insert("companyUsers", {
        companyId,
        userId,
        role: "admin",
      });
    }

    return { 
      message: "Admin user (admin/admin) and Master Company seeded successfully with hashed password.",
    };
  },
});