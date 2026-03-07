import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ROLES } from "./schema";

// All available permissions in the system
export const ALL_PERMISSIONS = [
  "commitments.view",
  "commitments.create",
  "commitments.edit",
  "commitments.delete",
  "payments.view",
  "payments.create",
  "payments.delete",
  "accounts.view",
  "accounts.create",
  "accounts.edit",
  "accounts.delete",
  "users.view",
  "users.create",
  "users.edit",
  "users.delete",
  "reports.view",
  "settings.view",
  "settings.edit",
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

export const PERMISSION_LABELS: Record<string, string> = {
  "commitments.view": "عرض الالتزامات",
  "commitments.create": "إنشاء الالتزامات",
  "commitments.edit": "تعديل الالتزامات",
  "commitments.delete": "حذف الالتزامات",
  "payments.view": "عرض المدفوعات",
  "payments.create": "إنشاء المدفوعات",
  "payments.delete": "حذف المدفوعات",
  "accounts.view": "عرض الحسابات",
  "accounts.create": "إنشاء الحسابات",
  "accounts.edit": "تعديل الحسابات",
  "accounts.delete": "حذف الحسابات",
  "users.view": "عرض المستخدمين",
  "users.create": "إنشاء المستخدمين",
  "users.edit": "تعديل المستخدمين",
  "users.delete": "حذف المستخدمين",
  "reports.view": "عرض التقارير",
  "settings.view": "عرض الإعدادات",
  "settings.edit": "تعديل الإعدادات",
};

export const PERMISSION_GROUPS: Record<string, string[]> = {
  "الالتزامات": ["commitments.view", "commitments.create", "commitments.edit", "commitments.delete"],
  "المدفوعات": ["payments.view", "payments.create", "payments.delete"],
  "الحسابات": ["accounts.view", "accounts.create", "accounts.edit", "accounts.delete"],
  "المستخدمون": ["users.view", "users.create", "users.edit", "users.delete"],
  "التقارير والإعدادات": ["reports.view", "settings.view", "settings.edit"],
};

// Helper to check if current user is admin of company
async function assertCompanyAdmin(ctx: any, companyId: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const user = await ctx.db.get(userId);
  const isSystemAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN;
  if (isSystemAdmin) return userId;

  const companyUser = await ctx.db
    .query("companyUsers")
    .withIndex("by_companyId_and_userId", (q: any) =>
      q.eq("companyId", companyId).eq("userId", userId)
    )
    .first();

  if (companyUser?.role !== "admin") {
    throw new Error("Only company admins can manage permissions");
  }
  return userId;
}

// ---- Positions ----

export const getPositions = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db
      .query("positions")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("asc")
      .take(200);
  },
});

export const createPosition = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await assertCompanyAdmin(ctx, args.companyId);

    // Check duplicate name
    const existing = await ctx.db
      .query("positions")
      .withIndex("by_companyId_and_name", (q) =>
        q.eq("companyId", args.companyId).eq("name", args.name.trim())
      )
      .first();
    if (existing) throw new Error("المنصب موجود بالفعل");

    return await ctx.db.insert("positions", {
      companyId: args.companyId,
      name: args.name.trim(),
      permissions: args.permissions,
      createdBy: userId,
    });
  },
});

export const updatePosition = mutation({
  args: {
    positionId: v.id("positions"),
    name: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const position = await ctx.db.get(args.positionId);
    if (!position) throw new Error("Position not found");

    await assertCompanyAdmin(ctx, position.companyId);

    // Check duplicate name (excluding self)
    const existing = await ctx.db
      .query("positions")
      .withIndex("by_companyId_and_name", (q) =>
        q.eq("companyId", position.companyId).eq("name", args.name.trim())
      )
      .first();
    if (existing && existing._id !== args.positionId) throw new Error("المنصب موجود بالفعل");

    await ctx.db.patch(args.positionId, {
      name: args.name.trim(),
      permissions: args.permissions,
    });
  },
});

export const deletePosition = mutation({
  args: { positionId: v.id("positions") },
  handler: async (ctx, args) => {
    const position = await ctx.db.get(args.positionId);
    if (!position) throw new Error("Position not found");

    await assertCompanyAdmin(ctx, position.companyId);

    // Remove position from all user positions
    const userPositions = await ctx.db
      .query("userPositions")
      .withIndex("by_companyId", (q) => q.eq("companyId", position.companyId))
      .take(500);

    for (const up of userPositions) {
      if (up.positionId === args.positionId) {
        await ctx.db.patch(up._id, { positionId: undefined });
      }
    }

    await ctx.db.delete(args.positionId);
  },
});

// ---- User Positions & Permissions ----

export const getUserPositions = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const companyUsers = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .take(200);

    const result = [];
    for (const cu of companyUsers) {
      const user = await ctx.db.get(cu.userId);
      const userPosition = await ctx.db
        .query("userPositions")
        .withIndex("by_companyId_and_userId", (q) =>
          q.eq("companyId", args.companyId).eq("userId", cu.userId)
        )
        .first();

      let position = null;
      if (userPosition?.positionId) {
        position = await ctx.db.get(userPosition.positionId);
      }

      result.push({
        userId: cu.userId,
        userName: user?.name || user?.username || "Unknown",
        username: user?.username,
        companyRole: cu.role,
        positionId: userPosition?.positionId,
        positionName: position?.name,
        positionPermissions: position?.permissions || [],
        grantedPermissions: userPosition?.grantedPermissions || [],
        revokedPermissions: userPosition?.revokedPermissions || [],
        effectivePermissions: computeEffectivePermissions(
          position?.permissions || [],
          userPosition?.grantedPermissions || [],
          userPosition?.revokedPermissions || []
        ),
      });
    }
    return result;
  },
});

function computeEffectivePermissions(
  positionPerms: string[],
  granted: string[],
  revoked: string[]
): string[] {
  const set = new Set([...positionPerms, ...granted]);
  for (const r of revoked) set.delete(r);
  return Array.from(set);
}

export const setUserPosition = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    positionId: v.optional(v.id("positions")),
    grantedPermissions: v.array(v.string()),
    revokedPermissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const adminId = await assertCompanyAdmin(ctx, args.companyId);

    const existing = await ctx.db
      .query("userPositions")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", args.companyId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        positionId: args.positionId,
        grantedPermissions: args.grantedPermissions,
        revokedPermissions: args.revokedPermissions,
        updatedBy: adminId,
      });
    } else {
      await ctx.db.insert("userPositions", {
        companyId: args.companyId,
        userId: args.userId,
        positionId: args.positionId,
        grantedPermissions: args.grantedPermissions,
        revokedPermissions: args.revokedPermissions,
        updatedBy: adminId,
      });
    }
  },
});

export const getAllPermissions = query({
  args: {},
  handler: async () => {
    return {
      permissions: ALL_PERMISSIONS,
      labels: PERMISSION_LABELS,
      groups: PERMISSION_GROUPS,
    };
  },
});

// Get current user's effective permissions for a specific company
export const getMyPermissions = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    // System admins have all permissions
    if (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN) {
      return ALL_PERMISSIONS as unknown as string[];
    }

    // Check if company admin
    const companyUser = await ctx.db
      .query("companyUsers")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", args.companyId).eq("userId", userId)
      )
      .first();

    if (companyUser?.role === "admin") {
      return ALL_PERMISSIONS as unknown as string[];
    }

    // Get position-based permissions
    const userPosition = await ctx.db
      .query("userPositions")
      .withIndex("by_companyId_and_userId", (q) =>
        q.eq("companyId", args.companyId).eq("userId", userId)
      )
      .first();

    let positionPerms: string[] = [];
    if (userPosition?.positionId) {
      const position = await ctx.db.get(userPosition.positionId);
      positionPerms = position?.permissions || [];
    }

    return computeEffectivePermissions(
      positionPerms,
      userPosition?.grantedPermissions || [],
      userPosition?.revokedPermissions || []
    );
  },
});