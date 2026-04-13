import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// @ts-ignore
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isAuthRoute = ["/login", "/register"].includes(nextUrl.pathname);

  if (isApiAuthRoute) return;

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return;
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
