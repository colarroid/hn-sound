/**
 * How many digits the email verification code has.
 *
 * Supabase decides this, under Authentication > Providers > Email > Email OTP
 * Length, and does not expose it over the API, so the app has to be told. Set
 * NEXT_PUBLIC_EMAIL_OTP_LENGTH to match whatever the dashboard says. Leave both
 * at 6 and everything lines up.
 *
 * Being a NEXT_PUBLIC_ value it is inlined at build time, so changing it needs a
 * rebuild locally and a redeploy on Vercel.
 */
const DEFAULT_LENGTH = 6;

/** Supabase's own permitted range. */
export const OTP_MIN_LENGTH = 6;
export const OTP_MAX_LENGTH = 10;

function resolveLength() {
  const parsed = Number.parseInt(process.env.NEXT_PUBLIC_EMAIL_OTP_LENGTH ?? "", 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LENGTH;
  return Math.min(OTP_MAX_LENGTH, Math.max(OTP_MIN_LENGTH, parsed));
}

export const OTP_LENGTH = resolveLength();

const WORDS: Record<number, string> = {
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
};

/** For copy: "six" in "a six digit code". */
export const OTP_LENGTH_WORD = WORDS[OTP_LENGTH] ?? String(OTP_LENGTH);

/** "an eight digit code" but "a six digit code", so the copy reads at any length. */
export const OTP_LENGTH_ARTICLE = /^[aeiou]/i.test(OTP_LENGTH_WORD) ? "an" : "a";
