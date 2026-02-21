import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedSuperAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Check if superadmin already exists
    const existingSuperAdmin = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", "superadmin"))
      .first();

    if (existingSuperAdmin) {
      return { message: "Superadmin already exists" };
    }

    // 2. Create Superadmin User
    const userId = await ctx.db.insert("users", {
      name: "Super Admin",
      username: "superadmin",
      email: "superadmin@commitmenttracker.pro",
      role: "admin",
    });

    // 3. Create Master Company
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

    // 4. Link User to Company
    await ctx.db.insert("companyUsers", {
      companyId,
      userId,
      role: "admin",
    });

    return { 
      message: "Superadmin and Master Company created successfully",
      email: "superadmin@commitmenttracker.pro",
      password: "Ahmed1975 (Please set this via the auth provider or manual entry if needed)"
    };
  },
});
