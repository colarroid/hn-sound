import { CHURCH_NAME } from "@/lib/brand";
import { escapeHtml } from "@/lib/email/html";
import type { FaultyDigestItem } from "@/lib/inventory/faulty-digest";
import { siteUrl } from "@/lib/site";

const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** "Waiting 12 days" reads as a nag. "Waiting 0 days" does not. */
function waitingLabel(item: FaultyDigestItem) {
  if (item.daysWaiting === null) return item.flaggedOn ? `Flagged ${item.flaggedOn}` : null;
  if (item.daysWaiting === 0) return "Flagged today";
  if (item.daysWaiting === 1) return "Waiting 1 day";
  return `Waiting ${item.daysWaiting} days`;
}

function itemRow(item: FaultyDigestItem) {
  const heading = item.label ? `${item.name} (${item.label})` : item.name;
  const waiting = waitingLabel(item);

  const reporter = item.flaggedBy ? `Reported by ${item.flaggedBy}` : "Reporter no longer listed";

  return `<tr><td style="padding:0 32px;">
    <div style="border-top:1px solid #eceef0;padding:16px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="font-family:${FONT};font-size:15px;font-weight:600;line-height:1.4;color:#111418;">${escapeHtml(heading)}</td>
        ${
          waiting
            ? `<td align="right" style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:#c93a33;white-space:nowrap;padding-left:12px;">${escapeHtml(waiting)}</td>`
            : ""
        }
      </tr></table>

      <div style="margin-top:4px;font-family:${FONT};font-size:12px;line-height:1.5;color:#9ca3af;">${escapeHtml(item.category)}${item.location ? ` &middot; ${escapeHtml(item.location)}` : ""}</div>

      ${
        item.faultNote
          ? `<div style="margin-top:10px;border-left:3px solid #e4e6e9;padding-left:12px;font-family:${FONT};font-size:14px;line-height:1.6;color:#4b5563;white-space:pre-line;">${escapeHtml(item.faultNote)}</div>`
          : ""
      }

      <div style="margin-top:8px;font-family:${FONT};font-size:12px;line-height:1.5;color:#9ca3af;">${escapeHtml(reporter)}</div>
    </div>
  </td></tr>`;
}

/**
 * The twice weekly nudge an admin gets about kit that is still broken.
 *
 * Same shape as the auth and training emails: light background, crimson rule,
 * hosted logo, square corners, and inline styles throughout because email
 * clients ignore stylesheets.
 */
export function faultyItemsReminderEmail({
  firstName,
  items,
}: {
  firstName: string;
  items: FaultyDigestItem[];
}) {
  const count = items.length;
  const noun = count === 1 ? "item" : "items";

  const subject =
    count === 0
      ? "Nothing needs fixing"
      : `${count} ${noun} still ${count === 1 ? "needs" : "need"} fixing`;

  const link = `${siteUrl()}/inventory/needs-fixing`;

  const oldest = items.reduce<number | null>((worst, item) => {
    if (item.daysWaiting === null) return worst;
    return worst === null || item.daysWaiting > worst ? item.daysWaiting : worst;
  }, null);

  const lede =
    count === 0
      ? "Nothing in the inventory is flagged as faulty. This is the layout you will see when something is."
      : `Hello ${escapeHtml(firstName)}, ${count === 1 ? "this is" : "these are"} still flagged as faulty in the inventory.${
          oldest !== null && oldest >= 7
            ? ` The oldest has been waiting ${oldest} days.`
            : ""
        }`;

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

          <tr><td style="padding:26px 32px 0 32px;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:#c93a33;">Needs fixing</td></tr>

          <tr><td style="padding:10px 32px 0 32px;font-family:${FONT};font-size:24px;line-height:1.32;font-weight:700;letter-spacing:-0.3px;color:#111418;">${escapeHtml(subject)}</td></tr>

          <tr><td style="padding:16px 32px 20px 32px;font-family:${FONT};font-size:15px;line-height:1.6;color:#4b5563;">${lede}</td></tr>

          ${items.map(itemRow).join("")}

          <tr><td style="padding:24px 32px 0 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="background-color:#c93a33;">
                <a href="${link}" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Open the needs-fixing list</a>
              </td>
            </tr></table>
          </td></tr>

          <tr><td style="padding:22px 32px 30px 32px;">
            <div style="border-top:1px solid #eceef0;padding-top:18px;font-family:${FONT};font-size:13px;line-height:1.6;color:#6b7280;">
              This goes out every Monday and Friday to admins, and stops for an item as soon as someone clears the fault.
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
