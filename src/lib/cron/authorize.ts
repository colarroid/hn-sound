import { NextResponse, type NextRequest } from "next/server";

import { emailConfigured } from "@/lib/email/send";

/**
 * The gate every scheduled route sits behind.
 *
 * These endpoints are ordinary public URLs. The session proxy deliberately does
 * not cover them, because a scheduler has no session and nowhere to follow a
 * redirect to, so each one has to carry its own lock. Vercel attaches
 * `Authorization: Bearer $CRON_SECRET` to its scheduled requests when that
 * variable is set, and this compares it.
 *
 * With no secret configured it refuses to run rather than falling open. A
 * forgotten environment variable is the ordinary way this goes wrong, and the
 * cost of guessing wrong is a stranger being able to mail the department and
 * read member data out of it. A missing secret costs a silent job, which gets
 * noticed; an open door does not.
 *
 * Returns a response to send back, or null when the caller may proceed.
 */
export function authorizeCron(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not set, so this route is disabled." },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  if (!emailConfigured()) {
    return NextResponse.json(
      { ok: false, error: "RESEND_API_KEY is not set, so no email can be sent." },
      { status: 503 },
    );
  }

  return null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * `?test=<address>` diverts a run to one address instead of the real audience,
 * so a schedule can be checked on demand without waiting for the day it fires.
 * Returns the address, null when absent, or a response when it is malformed.
 */
export function readTestAddress(
  request: NextRequest,
): { address: string | null } | NextResponse {
  const raw = request.nextUrl.searchParams.get("test")?.trim() || null;

  if (raw && !EMAIL.test(raw)) {
    return NextResponse.json(
      { ok: false, error: "The test address is not a valid email address." },
      { status: 400 },
    );
  }

  return { address: raw };
}
