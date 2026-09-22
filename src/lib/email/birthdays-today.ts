import type { UpcomingBirthday } from "@/lib/birthdays";
import { CHURCH_NAME } from "@/lib/brand";
import { escapeHtml } from "@/lib/email/html";
import { siteUrl } from "@/lib/site";

const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function personRow(person: UpcomingBirthday) {
  return `<tr><td style="padding:0 32px;">
    <div style="border-top:1px solid #eceef0;padding:16px 0;">
      <div style="font-family:${FONT};font-size:17px;font-weight:600;line-height:1.4;color:#111418;">${escapeHtml(person.name)}</div>
      ${
        person.position
          ? `<div style="margin-top:4px;font-family:${FONT};font-size:13px;line-height:1.5;color:#9ca3af;">${escapeHtml(person.position)}</div>`
          : ""
      }
    </div>
  </td></tr>`;
}

/**
 * The morning note telling the admins whose birthday it is today.
 *
 * Same shape as the other app-sent email: light background, crimson rule, hosted
 * logo, square corners, inline styles throughout because email clients ignore
 * stylesheets.
 */
export function birthdaysTodayEmail({
  firstName,
  people,
}: {
  firstName: string;
  people: UpcomingBirthday[];
}) {
  const count = people.length;

  const subject =
    count === 0
      ? "No birthdays today"
      : count === 1
        ? `It is ${people[0].name}'s birthday today`
        : `${count} birthdays today`;

  const link = `${siteUrl()}/birthdays`;

  const lede =
    count === 0
      ? "Nobody in the department has a birthday today. This is the layout you will see when somebody does."
      : `Good morning ${escapeHtml(firstName)}. ${
          count === 1
            ? "Someone in the department is celebrating today."
            : "A few people in the department are celebrating today."
        } A message from the department goes a long way.`;

  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(subject)}</title></head>
  <body style="margin:0;padding:0;background-color:#f2f3f5;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(subject)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f3f5;">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:#ffffff;border:1px solid #e4e6e9;">
          <tr><td style="height:3px;background-color:#c93a33;line-height:3px;font-size:0;">&nbsp;</td></tr>

          <tr><td style="padding:30px 32px 0 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right:12px;">
                <img src="https://sound.thehopenation.net/assets/favicon.png" width="46" height="40" alt="${escapeHtml(CHURCH_NAME)}" style="display:block;border:0;outline:none;text-decoration:none;" />
              </td>
              <td style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:#6b7280;">Sound &amp; Technical</td>
            </tr></table>
          </td></tr>

          <tr><td style="padding:26px 32px 0 32px;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:#c93a33;">Today</td></tr>

          <tr><td style="padding:10px 32px 0 32px;font-family:${FONT};font-size:24px;line-height:1.32;font-weight:700;letter-spacing:-0.3px;color:#111418;">${escapeHtml(subject)}</td></tr>

          <tr><td style="padding:16px 32px 20px 32px;font-family:${FONT};font-size:15px;line-height:1.6;color:#4b5563;">${lede}</td></tr>

          ${people.map(personRow).join("")}

          <tr><td style="padding:24px 32px 0 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="background-color:#c93a33;">
                <a href="${link}" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">See the birthday list</a>
              </td>
            </tr></table>
          </td></tr>

          <tr><td style="padding:22px 32px 30px 32px;">
            <div style="border-top:1px solid #eceef0;padding-top:18px;font-family:${FONT};font-size:13px;line-height:1.6;color:#6b7280;">
              This goes out to admins on the morning of a birthday. Phone numbers are on the members page if you would rather call.
            </div>
          </td></tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;"><tr>
          <td align="center" style="padding:20px 16px 0 16px;font-family:${FONT};font-size:11px;letter-spacing:1.4px;text-transform:uppercase;line-height:1.6;color:#9ca3af;">${escapeHtml(CHURCH_NAME)}</td>
        </tr></table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}
