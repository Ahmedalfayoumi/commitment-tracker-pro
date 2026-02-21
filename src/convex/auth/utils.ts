import { Password } from "@convex-dev/auth/providers/Password";

/**
 * Hashes a password using the default crypto implementation of the Password provider.
 * This ensures compatibility with the authentication logic.
 */
export async function hashPassword(password: string): Promise<string> {
  // We initialize the Password provider to get access to its default crypto implementation
  const provider = Password({});
  
  // The Password provider returns an object that includes the crypto implementation
  // We need to cast it to access the crypto property as it's not in the base AuthProviderConfig type
  const crypto = (provider as any).crypto;
  
  if (!crypto || typeof crypto.hashSecret !== "function") {
    throw new Error("Could not find hashSecret function on Password provider");
  }
  
  return await crypto.hashSecret(password);
}
