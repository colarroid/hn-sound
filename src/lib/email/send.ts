import { CHURCH_NAME, DEPARTMENT_NAME } from "@/lib/brand";

const ENDPOINT = "https://api.resend.com/emails";

/** Falls back to the verified sender so only the key is required config. */
const DEFAULT_FROM = `${CHURCH_NAME} ${DEPARTMENT_NAME} <noreply@sound.thehopenation.net>`;

export type EmailResult =
  | { status: "sent" }
  | { status: "skipped" }
  | { status: "failed"; error: string };

/**
 * Whether outbound email is switched on. Supabase's own templates cover the auth
 * emails; this is for everything the app sends itself, which Supabase never sees.
 */
export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Sends one message through Resend.
 *
 * Never throws. A failed notification must not undo the thing it was announcing:
 * training access is granted in the database first, and the caller reports whether
 * the email got out separately.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: "skipped" };

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { status: "failed", error: `${response.status} ${body.slice(0, 300)}` };
    }

    return { status: "sent" };
  } catch (error) {
    return { status: "failed", error: String(error) };
  }
}

/** Turns a batch of results into the one line the admin sees. */
export function summariseDelivery(results: EmailResult[]) {
  if (results.length === 0) return null;
  if (results.every((r) => r.status === "skipped")) {
    return "Email is not switched on, so nobody was notified.";
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;

  if (failed === 0) return `${sent} notified by email.`;
  if (sent === 0) return "Access was granted, but the emails could not be sent.";
  return `${sent} notified by email, ${failed} could not be sent.`;
}
