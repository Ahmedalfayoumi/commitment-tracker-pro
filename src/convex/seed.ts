import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedSuperAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Check if superadmin already exists in users table
    const existingUser = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", "superadmin"))
      .first();

    if (existingUser) {
      return { message: "Superadmin user already exists" };
    }

    // 2. Create Superadmin User
    const userId = await ctx.db.insert("users", {
      name: "Super Admin",
      username: "superadmin",
      email: "superadmin@commitmenttracker.pro",
      role: "admin",
    });

    // 3. Create Password Account (This is what allows the login to work)
    // Note: We use a placeholder for the password hash. 
    // In a real scenario, you'd use the library's hashing, 
    // but for seeding we'll set up the account link.
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: "superadmin",
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
      message: "Superadmin and Master Company created successfully. Please use the 'Forgot Password' or a temporary signup to set the actual password if the provider requires a hash.",
    };
  },
});