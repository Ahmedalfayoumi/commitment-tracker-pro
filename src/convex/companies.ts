import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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

    // Add owner as admin user for this company
    await ctx.db.insert("companyUsers", {
      companyId,
      userId,
      role: "admin",
    });

    return companyId;
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
