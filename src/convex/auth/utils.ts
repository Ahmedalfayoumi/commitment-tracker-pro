import { Password } from "@convex-dev/auth/providers/Password";

/**
 * Hashes a password using the default crypto implementation of the Password provider.
 * This ensures compatibility with the authentication logic.
 */
export async function hashPassword(password: string): Promise<string> {
  const provider = Password({});
  // The Password provider structure can vary between versions, so we check both locations
  const crypto = (provider as any).options?.crypto || (provider as any).crypto;

  if (!crypto || typeof crypto.hashSecret !== "function") {
    console.error("Provider structure:", JSON.stringify(Object.keys(provider)));
    if ((provider as any).options) {
      console.error("Options structure:", JSON.stringify(Object.keys((provider as any).options)));
    }
    throw new Error("Could not find hashSecret function on Password provider. Please check the provider configuration.");
  }

  return await crypto.hashSecret(password);
}