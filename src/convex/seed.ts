import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ROLES } from "./schema";

export const seedSuperAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Check if admin already exists in users table
    const existingUser = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", "admin"))
      .first();

    if (existingUser) {
      return { message: "Admin user already exists" };
    }

    // 2. Create Admin User
    const userId = await ctx.db.insert("users", {
      name: "System Admin",
      username: "admin",
      email: "admin@commitmenttracker.pro",
      role: ROLES.ADMIN,
    });

    // 3. Create Password account for the admin
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: "admin",
      secret: "admin", // Note: In a production environment, this should be hashed
    });

    // 4. Create Master Company
    const companyId = await ctx.db.insert("companies", {
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

    // 5. Link User to Company
    await ctx.db.insert("companyUsers", {
      companyId,
      userId,
      role: "admin",
    });

    return { 
      message: "Admin user (admin/admin) and Master Company created successfully.",
    };
  },
});