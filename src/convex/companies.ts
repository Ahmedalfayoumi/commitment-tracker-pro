import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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

// Add a new user to a company
export const addCompanyUser = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    username: v.string(),
    password: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Check if current user is admin of this company
    const companyUser = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", args.companyId).eq("userId", userId)
      )
      .first();

    if (!companyUser || companyUser.role !== "admin") {
      throw new Error("Only company admins can add users");
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
    }

    return newUserId;
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
        return {
          ...user,
          companyUserRole: cu.role,
          companyUserId: cu._id,
        };
      })
    );

    return users;
  },
});

// Remove user from company
export const removeCompanyUser = mutation({
  args: { companyUserId: v.id("companyUsers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const linkToRemove = await ctx.db.get(args.companyUserId);
    if (!linkToRemove) throw new Error("Link not found");

    // Check if current user is admin of this company
    const currentUserLink = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", linkToRemove.companyId).eq("userId", userId)
      )
      .first();

    if (!currentUserLink || currentUserLink.role !== "admin") {
      throw new Error("Only company admins can remove users");
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const companyUser = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", args.companyId).eq("userId", userId)
      )
      .first();

    if (!companyUser || companyUser.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const { companyId, ...updates } = args;
    await ctx.db.patch(companyId, updates);

    return companyId;
  },
});

// Generate file upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});