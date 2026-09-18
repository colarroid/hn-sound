/**
 * Guards against a name, note or title breaking the markup, or worse. Every
 * value that reaches an email template is member-supplied, so nothing goes into
 * one without passing through here first.
 */
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
