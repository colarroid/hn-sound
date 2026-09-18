import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next 16 renamed the middleware convention to proxy. Runs on every navigation:
 * refreshes the Supabase session cookies, then decides whether this request is
 * allowed where it is going.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files, so the session is
     * refreshed on real navigations only.
     *
     * `api/cron` is excluded because those requests come from a scheduler, not
     * a browser. There is no session to refresh and nowhere to send a redirect,
     * so leaving them in here would bounce every scheduled run to /login and the
     * job would fail silently while looking perfectly deployed. Each route under
     * it authenticates its own caller against CRON_SECRET instead.
     */
    "/((?!api/cron|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
