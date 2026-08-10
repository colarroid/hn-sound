import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";

/** Reachable without a session. */
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/auth/confirm",
  "/auth/callback",
  "/auth/auth-error",
];

/** Reachable with a session that has not verified its email yet. */
const UNVERIFIED_PATHS = ["/verify-email", "/auth/confirm", "/auth/callback", "/auth/auth-error"];

function matches(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Do not remove. This refreshes the session and rewrites the auth cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = matches(pathname, PUBLIC_PATHS);

  if (!user) {
    if (isPublic) return response;
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(login);
  }

  // Signed in but email not confirmed. Full access is withheld until it is.
  if (!user.email_confirmed_at && !matches(pathname, UNVERIFIED_PATHS)) {
    const verify = request.nextUrl.clone();
    verify.pathname = "/verify-email";
    verify.search = user.email ? `?email=${encodeURIComponent(user.email)}` : "";
    return NextResponse.redirect(verify);
  }

  // Verified users have no business on the signed-out screens.
  if (user.email_confirmed_at && matches(pathname, ["/login", "/signup", "/verify-email"])) {
    const home = request.nextUrl.clone();
    home.pathname = "/dashboard";
    home.search = "";
    return NextResponse.redirect(home);
  }

  return response;
}
