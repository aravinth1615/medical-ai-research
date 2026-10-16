import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_AUTHED_ROUTE, SESSION_COOKIE } from "@/lib/auth/config";

const PUBLIC_ROUTES = [/^\/login$/];

/**
 * First line of the route guard: no session cookie, no app route. The client
 * `AuthGuard` is the second line — it also catches a cookie whose stored
 * session has expired or been cleared.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((re) => re.test(pathname));
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!isPublic && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (isPublic && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = DEFAULT_AUTHED_ROUTE;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico)$).*)"],
};
