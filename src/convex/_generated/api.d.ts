/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth_utils from "../auth/utils.js";
import type * as commitments from "../commitments.js";
import type * as companies from "../companies.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as excel from "../excel.js";
import type * as http from "../http.js";
import type * as notificationActions from "../notificationActions.js";
import type * as notifications from "../notifications.js";
import type * as payments from "../payments.js";
import type * as permissions from "../permissions.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  admin: typeof admin;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  "auth/utils": typeof auth_utils;
  commitments: typeof commitments;
  companies: typeof companies;
  crons: typeof crons;
  debug: typeof debug;
  excel: typeof excel;
  http: typeof http;
  notificationActions: typeof notificationActions;
  notifications: typeof notifications;
  payments: typeof payments;
  permissions: typeof permissions;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
