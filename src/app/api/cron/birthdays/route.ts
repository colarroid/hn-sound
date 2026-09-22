import { NextResponse, type NextRequest } from "next/server";

import { authorizeCron, readTestAddress } from "@/lib/cron/authorize";
import { birthdaysTodayEmail } from "@/lib/email/birthdays-today";
import { sendEmail } from "@/lib/email/send";
import { loadBirthdayDigest } from "@/lib/members/birthday-digest";

/**
 * The morning note telling admins whose birthday falls today.
 *
 * Scheduled in `vercel.json` for 06:00 UTC, which is 07:00 in Lagos. West Africa
 * Time holds UTC+1 all year with no daylight saving, so the offset never needs
 * revisiting.
 *
 * `?test=<address>` sends one copy there instead of to the admins, and sends
 * even on a day with no birthdays.
 */
export async function GET(request: NextRequest) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const test = readTestAddress(request);
  if (test instanceof NextResponse) return test;
  const testAddress = test.address;

  let digest;
  try {
    digest = await loadBirthdayDigest();
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }

  const { people, recipients } = digest;

  // Most days nobody has a birthday. Sending anyway would make this the mail
  // everyone filters, and the filter would still be there on the day it matters.
  if (people.length === 0 && !testAddress) {
    return NextResponse.json({ ok: true, birthdays: 0, sent: 0, skipped: "nobody today" });
  }

  const audience = testAddress ? [{ email: testAddress, firstName: "there" }] : recipients;

  if (audience.length === 0) {
    return NextResponse.json({
      ok: true,
      birthdays: people.length,
      sent: 0,
      skipped: "no approved admin has an address",
    });
  }

  const results = await Promise.all(
    audience.map((person) => {
      const { subject, html } = birthdaysTodayEmail({
        firstName: person.firstName,
        people,
      });
      return sendEmail({ to: person.email, subject, html });
    }),
  );

  const sent = results.filter((result) => result.status === "sent").length;
  const failures = results.filter((result) => result.status === "failed");

  return NextResponse.json({
    ok: failures.length === 0,
    test: testAddress ?? undefined,
    birthdays: people.length,
    names: people.map((person) => person.name),
    recipients: audience.length,
    sent,
    failed: failures.length,
    errors: failures.map((failure) => failure.error).slice(0, 5),
  });
}
