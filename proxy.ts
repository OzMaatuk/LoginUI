import { auth } from "./src/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/api/auth", "/api/otp"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without session
  if (!isPublicRoute && !isLoggedIn && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect to profile if accessing login with valid session
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
