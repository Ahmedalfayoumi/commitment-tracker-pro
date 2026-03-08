import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { mutation, query, internalMutation, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { hashPassword } from "./auth/utils";
import { ROLES } from "./schema";

// Register a new company
export const registerCompany = mutation({
  args: {
    nameEn: v.string(),
    nameAr: v.string(),
    companyType: v.string(),
    sectors: v.array(v.string()),
    country: v.string(),
    city: v.string(),
    street: v.string(),
    buildingName: v.optional(v.string()),
    buildingNumber: v.optional(v.string()),
    floor: v.optional(v.string()),
    officeNumber: v.optional(v.string()),
    phone: v.string(),
    signatoryName: v.string(),
    signatoryPhone: v.string(),
    logoStorageId: v.optional(v.id("_storage")),
    faviconStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (user?.role !== ROLES.ADMIN) {
      throw new Error("Only system admins can register new companies");
    }

    const companyId = await ctx.db.insert("companies", {
      nameEn: args.nameEn,
      nameAr: args.nameAr,
      companyType: args.companyType,
      sectors: args.sectors,
      country: args.country,
      city: args.city,
      street: args.street,
      buildingName: args.buildingName,
      buildingNumber: args.buildingNumber,
      floor: args.floor,
      officeNumber: args.officeNumber,
      phone: args.phone,
      signatoryName: args.signatoryName,
      signatoryPhone: args.signatoryPhone,
      logoStorageId: args.logoStorageId,
      faviconStorageId: args.faviconStorageId,
      ownerId: userId,
      isActive: true,
    });

    // Add creator as admin user for this company
    await ctx.db.insert("companyUsers", {
      companyId,
      userId,
      role: "admin",
    });

    return companyId;
  },
});

// Add a new user to a company - converted to action to handle hashing
export const addCompanyUser = action({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    username: v.string(),
    password: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    positionId: v.optional(v.id("positions")),
  },
  handler: async (ctx, args): Promise<Id<"users">> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Hash the password before passing it to the internal mutation
    const hashedPassword = await hashPassword(args.password);

    return await ctx.runMutation(internal.companies.internalAddCompanyUser, {
      ...args,
      password: hashedPassword,
      currentUserId: userId,
    });
  },
});

export const internalAddCompanyUser = internalMutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    username: v.string(),
    password: v.string(), // This will be the hashed password
    role: v.union(v.literal("admin"), v.literal("user")),
    positionId: v.optional(v.id("positions")),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db.get(args.currentUserId);
    
    // Check if current user is system admin OR admin of this company
    const isSystemAdmin = currentUser?.role === ROLES.ADMIN;
    
    const companyUser = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", args.companyId).eq("userId", args.currentUserId)
      )
      .first();

    if (!isSystemAdmin && (!companyUser || companyUser.role !== "admin")) {
      throw new Error("Only company admins or system admins can add users");
    }

    // Check if username already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();

    let newUserId;
    if (!existingUser) {
      newUserId = await ctx.db.insert("users", {
        username: args.username,
        name: args.name,
        role: "user",
      });

      await ctx.db.insert("authAccounts", {
        userId: newUserId,
        provider: "password",
        providerAccountId: args.username,
        secret: args.password,
      });
    } else {
      newUserId = existingUser._id;
    }

    // Link user to company
    const existingLink = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", args.companyId).eq("userId", newUserId)
      )
      .first();

    if (!existingLink) {
      await ctx.db.insert("companyUsers", {
        companyId: args.companyId,
        userId: newUserId,
        role: args.role,
      });
    } else {
      // Update role if already linked
      await ctx.db.patch(existingLink._id, { role: args.role });
    }

    // Assign position if provided
    if (args.positionId) {
      const existingPosition = await ctx.db
        .query("userPositions")
        .withIndex("by_companyId_and_userId", (q) =>
          q.eq("companyId", args.companyId).eq("userId", newUserId)
        )
        .first();

      if (existingPosition) {
        await ctx.db.patch(existingPosition._id, {
          positionId: args.positionId,
          grantedPermissions: [],
          revokedPermissions: [],
          updatedBy: args.currentUserId,
        });
      } else {
        await ctx.db.insert("userPositions", {
          companyId: args.companyId,
          userId: newUserId,
          positionId: args.positionId,
          grantedPermissions: [],
          revokedPermissions: [],
          updatedBy: args.currentUserId,
        });
      }
    }

    return newUserId;
  },
});

// Update a user's role or name within a company
export const updateCompanyUser = mutation({
  args: {
    companyUserId: v.id("companyUsers"),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
    companyId: v.optional(v.id("companies")),
    positionId: v.optional(v.id("positions")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Unauthorized");

    const currentUser = await ctx.db.get(currentUserId);
    const companyUserLink = await ctx.db.get(args.companyUserId);
    if (!companyUserLink) throw new Error("Company user link not found");

    const isSystemAdmin = currentUser?.role === ROLES.ADMIN;

    // Check if current user is admin of this company
    const currentUserCompanyLink = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", companyUserLink.companyId).eq("userId", currentUserId)
      )
      .first();

    if (!isSystemAdmin && (!currentUserCompanyLink || currentUserCompanyLink.role !== "admin")) {
      throw new Error("Only company admins or system admins can update user roles");
    }

    // Update the user's role in companyUsers table
    if (args.role) {
      await ctx.db.patch(args.companyUserId, { role: args.role });
    }

    // Update the company if provided
    if (args.companyId) {
      await ctx.db.patch(args.companyUserId, { companyId: args.companyId });
    }

    // Update the user's name in the users table if provided
    if (args.name) {
      await ctx.db.patch(companyUserLink.userId, { name: args.name });
    }

    // Update position if provided (positionId can be undefined to clear it)
    if ("positionId" in args) {
      const targetCompanyId = args.companyId || companyUserLink.companyId;
      const existingPosition = await ctx.db
        .query("userPositions")
        .withIndex("by_companyId_and_userId", (q) =>
          q.eq("companyId", targetCompanyId).eq("userId", companyUserLink.userId)
        )
        .first();

      if (existingPosition) {
        await ctx.db.patch(existingPosition._id, {
          positionId: args.positionId,
          grantedPermissions: [],
          revokedPermissions: [],
          updatedBy: currentUserId,
        });
      } else if (args.positionId) {
        await ctx.db.insert("userPositions", {
          companyId: targetCompanyId,
          userId: companyUserLink.userId,
          positionId: args.positionId,
          grantedPermissions: [],
          revokedPermissions: [],
          updatedBy: currentUserId,
        });
      }
    }

    return companyUserLink.userId;
  },
});

// Get all users for a company
export const getCompanyUsers = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const companyUsers = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();

    const users = await Promise.all(
      companyUsers.map(async (cu) => {
        const user = await ctx.db.get(cu.userId);
        if (!user) return null;
        // Hide system admins from company user lists
        if (user.role === ROLES.ADMIN || user.role === ROLES.SUPERADMIN) return null;
        return {
          ...user,
          companyUserRole: cu.role,
          companyUserId: cu._id,
        };
      })
    );

    return users.filter((u) => u !== null);
  },
});

// Remove user from company
export const removeCompanyUser = mutation({
  args: { companyUserId: v.id("companyUsers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const currentUser = await ctx.db.get(userId);
    const linkToRemove = await ctx.db.get(args.companyUserId);
    if (!linkToRemove) throw new Error("Link not found");

    const isSystemAdmin = currentUser?.role === ROLES.ADMIN;

    // Check if current user is admin of this company
    const currentUserLink = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", linkToRemove.companyId).eq("userId", userId)
      )
      .first();

    if (!isSystemAdmin && (!currentUserLink || currentUserLink.role !== "admin")) {
      throw new Error("Only company admins or system admins can remove users");
    }

    // Prevent removing yourself if you are the owner
    const company = await ctx.db.get(linkToRemove.companyId);
    if (company?.ownerId === linkToRemove.userId) {
      throw new Error("Cannot remove the company owner");
    }

    await ctx.db.delete(args.companyUserId);
  },
});

// Get all companies for current user
export const getUserCompanies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const companyUsers = await ctx.db
      .query("companyUsers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const companies = await Promise.all(
      companyUsers.map(async (cu) => {
        const company = await ctx.db.get(cu.companyId);
        if (!company) return null;
        
        let logoUrl = null;
        let faviconUrl = null;
        
        if (company.logoStorageId) {
          logoUrl = await ctx.storage.getUrl(company.logoStorageId);
        }
        if (company.faviconStorageId) {
          faviconUrl = await ctx.storage.getUrl(company.faviconStorageId);
        }

        return {
          ...company,
          logoUrl,
          faviconUrl,
          userRole: cu.role,
        };
      })
    );

    return companies.filter((c) => c !== null);
  },
});

// Get single company by ID
export const getCompanyById = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const companyUser = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", args.companyId).eq("userId", userId)
      )
      .first();

    if (!companyUser) return null;

    const company = await ctx.db.get(args.companyId);
    if (!company) return null;

    let logoUrl = null;
    let faviconUrl = null;

    if (company.logoStorageId) {
      logoUrl = await ctx.storage.getUrl(company.logoStorageId);
    }
    if (company.faviconStorageId) {
      faviconUrl = await ctx.storage.getUrl(company.faviconStorageId);
    }

    return {
      ...company,
      logoUrl,
      faviconUrl,
      userRole: companyUser.role,
    };
  },
});

// Update company
export const updateCompany = mutation({
  args: {
    companyId: v.id("companies"),
    nameEn: v.optional(v.string()),
    nameAr: v.optional(v.string()),
    companyType: v.optional(v.string()),
    sectors: v.optional(v.array(v.string())),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    street: v.optional(v.string()),
    buildingName: v.optional(v.string()),
    buildingNumber: v.optional(v.string()),
    floor: v.optional(v.string()),
    officeNumber: v.optional(v.string()),
    phone: v.optional(v.string()),
    signatoryName: v.optional(v.string()),
    signatoryPhone: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    faviconStorageId: v.optional(v.id("_storage")),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    subscriptionPlan: v.optional(v.union(
      v.literal("1month"),
      v.literal("3months"),
      v.literal("6months"),
      v.literal("1year"),
    )),
    subscriptionExpiry: v.optional(v.number()),
    subscriptionExpiryReminderSent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    const isSystemAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN;

    if (!isSystemAdmin) {
      const companyUser = await ctx.db
        .query("companyUsers")
        .withIndex("by_companyId_and_userId", (q) =>
          q.eq("companyId", args.companyId).eq("userId", userId)
        )
        .first();

      if (!companyUser || companyUser.role !== "admin") {
        throw new Error("Unauthorized");
      }
    }

    const { companyId, ...updates } = args;
    await ctx.db.patch(companyId, updates);

    return companyId;
  },
});

// Set subscription for a company (admin only)
export const setSubscription = mutation({
  args: {
    companyId: v.id("companies"),
    plan: v.union(
      v.literal("1month"),
      v.literal("3months"),
      v.literal("6months"),
      v.literal("1year"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (user?.role !== ROLES.ADMIN && user?.role !== ROLES.SUPERADMIN) {
      throw new Error("Only system admins can manage subscriptions");
    }

    const planDurations: Record<string, number> = {
      "1month": 30 * 24 * 60 * 60 * 1000,
      "3months": 90 * 24 * 60 * 60 * 1000,
      "6months": 180 * 24 * 60 * 60 * 1000,
      "1year": 365 * 24 * 60 * 60 * 1000,
    };

    const now = Date.now();
    const company = await ctx.db.get(args.companyId);
    // If there's an existing unexpired subscription, extend from its expiry
    const baseTime = company?.subscriptionExpiry && company.subscriptionExpiry > now
      ? company.subscriptionExpiry
      : now;

    const newExpiry = baseTime + planDurations[args.plan];

    await ctx.db.patch(args.companyId, {
      subscriptionPlan: args.plan,
      subscriptionExpiry: newExpiry,
      subscriptionExpiryReminderSent: false,
    });

    return newExpiry;
  },
});

// Get all companies with subscription info (admin only)
export const getAllCompaniesAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (user?.role !== ROLES.ADMIN && user?.role !== ROLES.SUPERADMIN) return [];

    const companies = await ctx.db.query("companies").take(200);

    return await Promise.all(
      companies.map(async (company) => {
        let logoUrl = null;
        if (company.logoStorageId) {
          logoUrl = await ctx.storage.getUrl(company.logoStorageId);
        }
        return { ...company, logoUrl };
      })
    );
  },
});

// Internal mutation to send expiry reminder notifications
export const sendExpiryReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000;

    // Find companies expiring within 1 week that haven't had a reminder sent
    const companies = await ctx.db
      .query("companies")
      .withIndex("by_subscriptionExpiry", (q) =>
        q.gt("subscriptionExpiry", now).lt("subscriptionExpiry", oneWeekFromNow)
      )
      .take(100);

    for (const company of companies) {
      if (company.subscriptionExpiryReminderSent) continue;

      // Get all admin users for this company
      const companyUsers = await ctx.db
        .query("companyUsers")
        .withIndex("by_companyId", (q) => q.eq("companyId", company._id))
        .take(100);

      const adminUsers = companyUsers.filter((cu) => cu.role === "admin");

      // Also notify system admins
      const systemAdmins = await ctx.db
        .query("users")
        .take(200);

      const adminUserIds = new Set([
        ...adminUsers.map((cu) => cu.userId),
        ...systemAdmins
          .filter((u) => u.role === ROLES.ADMIN || u.role === ROLES.SUPERADMIN)
          .map((u) => u._id),
      ]);

      const expiryDate = new Date(company.subscriptionExpiry!);
      const formattedDate = expiryDate.toLocaleDateString("ar-SA");
      const message = `تنبيه: اشتراك شركة "${company.nameAr}" سينتهي في ${formattedDate}. يرجى تجديد الاشتراك.`;

      for (const adminUserId of adminUserIds) {
        // Insert a system notification (reuse notifications table with a special type)
        // We'll use a workaround: insert into notifications with a dummy commitmentId
        // Instead, we'll just log for now - a proper implementation would use a separate table
        console.log(`Reminder for user ${adminUserId}: ${message}`);
      }

      // Mark reminder as sent
      await ctx.db.patch(company._id, { subscriptionExpiryReminderSent: true });
    }
  },
});

// Delete company
export const deleteCompany = mutation({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (user?.role !== ROLES.ADMIN) {
      throw new Error("Only system admins can delete companies");
    }

    // Delete company users
    const companyUsers = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();
    
    for (const cu of companyUsers) {
      await ctx.db.delete(cu._id);
    }

    // Delete the company record
    await ctx.db.delete(args.companyId);
    
    return { success: true };
  },
});

// Generate file upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Public query to get total company count (excludes Master Company)
export const getPublicCompanyCount = query({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db
      .query("companies")
      .take(500);
    // Exclude the Master Company used for system admin
    return companies.filter(c => c.companyType !== "Master").length;
  },
});