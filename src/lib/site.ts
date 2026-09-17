/**
 * Absolute base URL, used to build the links that go out in emails.
 *
 * `NEXT_PUBLIC_SITE_URL` is inlined at build time, not read at runtime, so
 * leaving it unset in Vercel bakes the fallback below into the deployed bundle
 * and setting it afterwards changes nothing until the next build. The
 * deployment's own host is preferred over a localhost literal so that a missed
 * variable produces a reachable link rather than one that only works on the
 * machine that sent it.
 */
export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3100";
}

/**
 * Only same-site paths are ever followed after login, so a crafted ?next= cannot
 * bounce a member off to another host.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/signup")) return fallback;
  return value;
}
