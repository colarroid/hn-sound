import { NextResponse, type NextRequest } from "next/server";

import { authorizeCron, readTestAddress } from "@/lib/cron/authorize";
import { faultyItemsReminderEmail } from "@/lib/email/faulty-items-reminder";
import { sendEmail } from "@/lib/email/send";
import { loadFaultyDigest } from "@/lib/inventory/faulty-digest";

/**
 * The Monday and Friday reminder about kit that is still flagged faulty.
 *
 * Scheduled in `vercel.json`. The secret check lives in `authorizeCron`, shared
 * with the other scheduled routes so there is one place to get it right.
 *
 * `?test=<address>` sends one copy to that address instead of to the admins, and
 * sends even when nothing is faulty, so the layout can be checked on demand
 * without waiting for a Monday or breaking something to have data.
 */
export async function GET(request: NextRequest) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const test = readTestAddress(request);
  if (test instanceof NextResponse) return test;
  const testAddress = test.address;

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
