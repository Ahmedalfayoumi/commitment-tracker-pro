import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    // Companies table
    companies: defineTable({
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
      primaryColor: v.optional(v.string()),
      secondaryColor: v.optional(v.string()),
      ownerId: v.id("users"),
      isActive: v.boolean(),
    }).index("by_ownerId", ["ownerId"]),

    // Company users (many-to-many relationship)
    companyUsers: defineTable({
      companyId: v.id("companies"),
      userId: v.id("users"),
      role: v.union(v.literal("admin"), v.literal("user")),
    })
      .index("by_companyId", ["companyId"])
      .index("by_userId", ["userId"])
      .index("by_companyId_and_userId", ["companyId", "userId"]),

    // Commitments table
    commitments: defineTable({
      companyId: v.id("companies"),
      commitmentNumber: v.string(),
      numberPrefix: v.string(),
      numberSequence: v.number(),
      dueDate: v.number(),
      account: v.string(),
      description: v.string(),
      amount: v.number(),
      paidAmount: v.number(),
      status: v.union(
        v.literal("active"),
        v.literal("postponed"),
        v.literal("paid"),
        v.literal("partialPaid"),
        v.literal("cancelled")
      ),
      createdBy: v.id("users"),
    })
      .index("by_companyId", ["companyId"])
      .index("by_status", ["status"])
      .index("by_companyId_and_numberPrefix", ["companyId", "numberPrefix"]),

    // Payments table
    payments: defineTable({
      commitmentId: v.id("commitments"),
      companyId: v.id("companies"),
      amount: v.number(),
      paymentMethod: v.union(
        v.literal("cash"),
        v.literal("bankTransfer"),
        v.literal("creditCard"),
        v.literal("clique")
      ),
      paymentDate: v.number(),
      notes: v.optional(v.string()),
      createdBy: v.id("users"),
    })
      .index("by_commitmentId", ["commitmentId"])
      .index("by_companyId", ["companyId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;