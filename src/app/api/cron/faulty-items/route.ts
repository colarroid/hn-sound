import { NextResponse, type NextRequest } from "next/server";

import { faultyItemsReminderEmail } from "@/lib/email/faulty-items-reminder";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { loadFaultyDigest } from "@/lib/inventory/faulty-digest";

/**
 * The Monday and Friday reminder about kit that is still flagged faulty.
 *
 * Scheduled in `vercel.json`. Vercel attaches `Authorization: Bearer
 * $CRON_SECRET` to its own requests when that variable is set, which is the only
 * thing separating this route from anyone who guesses the path. With no secret
 * configured it refuses to run at all rather than falling open, because the
 * failure mode of falling open is a stranger being able to mail the department.
 *
 * `?test=<address>` sends one copy to that address instead of to the admins, and
 * sends even when nothing is faulty, so the layout can be checked on demand
 * without waiting for a Monday or breaking something to have data.
 */
export async function GET(request: NextRequest) {
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

  const testAddress = request.nextUrl.searchParams.get("test")?.trim() || null;
  if (testAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testAddress)) {
    return NextResponse.json(
      { ok: false, error: "The test address is not a valid email address." },
      { status: 400 },
    );
  }

  let digest;
  try {
    digest = await loadFaultyDigest();
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }

  const { items, recipients } = digest;

  // A reminder with nothing to remind anyone of is noise, and noise is how a
  // reminder gets ignored on the week it matters. A test always sends.
  if (items.length === 0 && !testAddress) {
    return NextResponse.json({ ok: true, faulty: 0, sent: 0, skipped: "nothing is faulty" });
  }

  const audience = testAddress
    ? [{ email: testAddress, firstName: "there" }]
    : recipients;

  if (audience.length === 0) {
    return NextResponse.json({
      ok: true,
      faulty: items.length,
      sent: 0,
      skipped: "no approved admin has an address",
    });
  }

  const results = await Promise.all(
    audience.map((person) => {
      const { subject, html } = faultyItemsReminderEmail({
        firstName: person.firstName,
        items,
      });
      return sendEmail({ to: person.email, subject, html });
    }),
  );

  const sent = results.filter((result) => result.status === "sent").length;
  const failures = results.filter((result) => result.status === "failed");

  return NextResponse.json({
    ok: failures.length === 0,
    test: testAddress ?? undefined,
    faulty: items.length,
    recipients: audience.length,
    sent,
    failed: failures.length,
    // Surfaced because a silent delivery failure is the thing that makes a
    // scheduled job look healthy while it quietly does nothing.
    errors: failures.map((failure) => failure.error).slice(0, 5),
  });
}
