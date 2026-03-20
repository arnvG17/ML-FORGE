import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase-admin";

/**
 * Server-only utility to get the current user ID from the Firebase session cookie.
 * This should ONLY be imported in API routes or Server Components.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) return null;

    const decoded = await getAdminAuth().verifyIdToken(sessionCookie);
    return decoded.uid;
  } catch (error) {
    console.error("[auth-server] Token verification failed:", error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) return null;

    const decoded = await getAdminAuth().verifyIdToken(sessionCookie);
    return {
      id: decoded.uid,
      name: decoded.name || decoded.email?.split("@")[0] || "Anonymous",
      image: decoded.picture || null,
    };
  } catch (error) {
    console.error("[auth-server] Token verification failed:", error);
    return null;
  }
}
