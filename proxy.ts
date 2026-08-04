import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Best-effort UX gate: redirects to /login if there's no session cookie at
// all. This does NOT validate the session against the database (that would
// mean a DB round trip on every request) and it does NOT run in front of
// Server Actions - every page and Server Action independently re-checks the
// real session via lib/auth/session.ts, which is the actual auth boundary.
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has("session");

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/((?!login|join|manifest.webmanifest|icons|favicon.ico|_next/static|_next/image).*)",
  ],
};
