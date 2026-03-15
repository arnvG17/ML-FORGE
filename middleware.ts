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
  console.log(`[Test] Middleware running for: ${request.nextUrl.pathname}`);
  // Temporarily disabling auth check to isolate the TypeError
  // if (!isPublicRoute(request)) {
  //   await auth.protect();
  // }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
