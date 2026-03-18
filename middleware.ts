import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/p/(.*)",
  "/embed/(.*)",
  "/api/sessions/share/(.*)",
  "/api/gallery(.*)",
  "/api/test-llm(.*)",
  "/api/test-pyodide-prompt(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  console.log(`[Middleware] Testing Path: ${request.nextUrl.pathname}`);
  if (!isPublicRoute(request)) {
    try {
      await auth.protect();
    } catch (error) {
      console.error("[Middleware] Auth protection failed:", error);
      throw error;
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
