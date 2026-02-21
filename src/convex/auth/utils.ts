import { Password } from "@convex-dev/auth/providers/Password";

/**
 * Hashes a password using the default crypto implementation of the Password provider.
 * This ensures compatibility with the authentication logic.
 */
export async function hashPassword(password: string): Promise<string> {
  const provider = Password({});
  const crypto = (provider as any)?.options?.crypto;

  if (!crypto || typeof crypto.hashSecret !== "function") {
    throw new Error("Could not find hashSecret function on Password provider");
  }

  return await crypto.hashSecret(password);
}