import { auth } from "@clerk/nextjs/server";

/**
 * Server-only utility to get the current user ID.
 * This should ONLY be imported in API routes or Server Components.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}
