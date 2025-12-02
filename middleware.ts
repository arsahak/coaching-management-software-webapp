import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Public paths that don't require authentication
const publicPaths = ["/sign-in", "/sign-up", "/forget-password"];

// API routes that should be accessible without auth
const publicApiPaths = ["/api/auth", "/api/portfolio"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isAuthenticated = !!session?.accessToken;

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/opengraph-image.png") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap")
  ) {
    return NextResponse.next();
  }

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isPublicApiPath = publicApiPaths.some((path) =>
    pathname.startsWith(path)
  );

  // Allow public API routes regardless of authentication
  if (isPublicApiPath) {
    return NextResponse.next();
  }

  // If user IS logged in
  if (isAuthenticated) {
    // Redirect authenticated users away from sign-in/sign-up pages
    if (isPublicPath) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Allow access to all other pages
    return NextResponse.next();
  }

  // If user IS NOT logged in
  if (!isAuthenticated) {
    // Allow access only to public auth pages
    if (isPublicPath) {
      return NextResponse.next();
    }
    // Redirect all other pages to sign-in
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
