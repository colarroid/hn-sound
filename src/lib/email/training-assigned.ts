import { CHURCH_NAME } from "@/lib/brand";
import { siteUrl } from "@/lib/site";

/** Guards against a title or note breaking the markup, or worse. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type AssignedMaterial = {
  title: string;
  lessonNumber: number | null;
  summary: string | null;
  expectations: string | null;
};

/**
 * The note a member gets when they are put on a training material.
 *
 * Same shape as the auth emails: light background, crimson rule, hosted logo, and
 * inline styles throughout because email clients ignore stylesheets.
 */
export function trainingAssignedEmail({
  firstName,
  material,
}: {
  firstName: string;
  material: AssignedMaterial;
}) {
  const lesson =
    material.lessonNumber === null ? "Reference material" : `Week ${material.lessonNumber}`;

  const subject = `New training for you: ${material.title}`;
  const link = `${siteUrl()}/training`;

  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(subject)}</title></head>
  <body style="margin:0;padding:0;background-color:#f2f3f5;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(lesson)}: ${escapeHtml(material.title)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f3f5;">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:#ffffff;border:1px solid #e4e6e9;">
          <tr><td style="height:3px;background-color:#c93a33;line-height:3px;font-size:0;">&nbsp;</td></tr>

          <tr><td style="padding:30px 32px 0 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right:12px;">
                <img src="https://sound.thehopenation.net/assets/favicon.png" width="46" height="40" alt="${escapeHtml(CHURCH_NAME)}" style="display:block;border:0;outline:none;text-decoration:none;" />
              </td>
              <td style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:#6b7280;">Sound &amp; Technical</td>
            </tr></table>
          </td></tr>

          <tr><td style="padding:26px 32px 0 32px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:#c93a33;">${escapeHtml(lesson)}</td></tr>

          <tr><td style="padding:10px 32px 0 32px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:24px;line-height:1.32;font-weight:700;letter-spacing:-0.3px;color:#111418;">${escapeHtml(material.title)}</td></tr>

          <tr><td style="padding:16px 32px 0 32px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#4b5563;">
            Hello ${escapeHtml(firstName)}, the head of department has added this to your training.
            ${material.summary ? `<br /><br />${escapeHtml(material.summary)}` : ""}
          </td></tr>

          ${
            material.expectations
              ? `<tr><td style="padding:22px 32px 0 32px;">
                   <div style="border-left:3px solid #c93a33;background-color:#f6f7f8;padding:14px 18px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                     <div style="font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#6b7280;">What you should learn</div>
                     <div style="margin-top:8px;font-size:14px;line-height:1.6;color:#111418;white-space:pre-line;">${escapeHtml(material.expectations)}</div>
                   </div>
                 </td></tr>`
              : ""
          }

          <tr><td style="padding:24px 32px 0 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="background-color:#c93a33;">
                <a href="${link}" style="display:inline-block;padding:13px 24px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Open your training</a>
              </td>
            </tr></table>
          </td></tr>

          <tr><td style="padding:22px 32px 30px 32px;">
            <div style="border-top:1px solid #eceef0;padding-top:18px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#6b7280;">
              You are seeing this because you are on the Sound &amp; Technical team. Training is assigned person by person, so this one is yours.
            </div>
          </td></tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;"><tr>
          <td align="center" style="padding:20px 16px 0 16px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;line-height:1.6;color:#9ca3af;">${escapeHtml(CHURCH_NAME)}</td>
        </tr></table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}
