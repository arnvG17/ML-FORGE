import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Server-only utility to get the current user ID.
 * This should ONLY be imported in API routes or Server Components.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

export async function getCurrentUser() {
  const user = await currentUser();
  if (!user) return null;
  return {
    id: user.id,
    name: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.username || "Anonymous",
    image: user.imageUrl,
  };
}
