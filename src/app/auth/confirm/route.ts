import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { safeNextPath } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/**
 * Lands every emailed auth link: signup confirmation, password recovery, email
 * change. Supabase's default templates come back with `?code=` after bouncing
 * through /auth/v1/verify. A template edited to use `{{ .TokenHash }}` comes
 * back with `?token_hash=&type=` instead, so both are handled here and the same
 * handler is mounted at /auth/callback.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");
  if (errorCode) {
    return NextResponse.redirect(
      new URL(
        `/auth/auth-error?reason=${encodeURIComponent(errorCode)}&detail=${encodeURIComponent(errorDescription ?? "")}`,
        origin,
      ),
    );
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Recovery links must land on the form that sets the new password.
  const fallback = type === "recovery" ? "/reset-password" : "/dashboard";
  const next = safeNextPath(searchParams.get("next"), fallback);

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    return NextResponse.redirect(
      new URL(`/auth/auth-error?reason=${encodeURIComponent(error.code ?? "exchange_failed")}`, origin),
    );
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
    return NextResponse.redirect(
      new URL(`/auth/auth-error?reason=${encodeURIComponent(error.code ?? "verify_failed")}`, origin),
    );
  }

  return NextResponse.redirect(new URL("/auth/auth-error?reason=missing_token", origin));
}
