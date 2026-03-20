import { NextRequest, NextResponse } from "next/server";

const publicPaths = [
  "/",
  "/sign-in",
  "/sign-up",
  "/p/",
  "/embed/",
  "/api/sessions/share/",
  "/api/gallery",
  "/api/test-llm",
  "/api/test-pyodide-prompt",
];

function isPublicRoute(pathname: string): boolean {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p));
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static files
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  console.log(`[Middleware] Path: ${pathname}`);

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for the Firebase session cookie
  const session = request.cookies.get("__session")?.value;
  if (!session) {
    const loginUrl = new URL("/sign-in", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie exists — let the request through.
  // Server-side token verification happens in auth-server.ts per API route.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)" ],
};
