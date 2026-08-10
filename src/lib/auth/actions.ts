"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseForm, type FormState } from "@/lib/form-state";
import { safeNextPath, siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { OTP_LENGTH, OTP_MAX_LENGTH, OTP_MIN_LENGTH } from "./otp";
import { emailSchema, passwordSchema, signInSchema, signUpSchema } from "./schemas";

/** Retyping a long signup form because of one bad field is miserable. */
const KEEP_ON_SIGNUP = ["firstName", "lastName", "email", "phone", "dateOfBirth"];

export async function signUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseForm(signUpSchema, formData, { keep: KEEP_ON_SIGNUP });
  if (!parsed.ok) return parsed.state;

  const { firstName, lastName, email, phone, dateOfBirth, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/dashboard`,
      // Read by the handle_new_user trigger. Role and position are deliberately
      // absent: everyone starts as a member and the admin assigns the rest.
      data: {
        first_name: firstName,
        last_name: lastName,
        phone,
        date_of_birth: dateOfBirth,
      },
    },
  });

  if (error) {
    return {
      ok: false,
      values: parsed.data as unknown as Record<string, string>,
      message:
        error.code === "user_already_exists" || /already registered/i.test(error.message)
          ? "An account with that email already exists. Log in instead."
          : error.message,
    };
  }

  // With email confirmation on, Supabase returns a placeholder user with no
  // identities when the address is already taken. Same destination either way,
  // so an outsider cannot use this form to test which addresses exist.
  const alreadyRegistered = (data.user?.identities?.length ?? 0) === 0;

  redirect(
    `/verify-email?email=${encodeURIComponent(email)}${alreadyRegistered ? "&existing=1" : ""}`,
  );
}

/**
 * Email confirmation is a six digit code rather than a link, so the member
 * finishes signing up in the tab they started in.
 */
export async function verifyEmailCodeAction(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const attempt = (prev.attempt ?? 0) + 1;

  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    return {
      ok: false,
      attempt,
      message: "We lost track of which address to verify. Start again from signup.",
    };
  }

  // Accept anything inside Supabase's permitted range rather than one exact
  // length, so a dashboard change to Email OTP Length cannot hard block a member
  // before the app is rebuilt with a matching OTP_LENGTH.
  const token = (formData.get("token") ?? "").toString().replace(/\D/g, "");
  if (token.length < OTP_MIN_LENGTH || token.length > OTP_MAX_LENGTH) {
    return {
      ok: false,
      attempt,
      message: `Enter all ${OTP_LENGTH} digits from the email.`,
    };
  }

  const supabase = await createClient();

  // A code from the "Confirm signup" template verifies as type 'signup'. The
  // generic 'email' type covers a code that was issued as a plain email OTP,
  // which is what an invited or re-sent address can end up with. The token is
  // only spent on success, so the second attempt costs nothing.
  let { error } = await supabase.auth.verifyOtp({
    email: email.data,
    token,
    type: "signup",
  });

  if (error) {
    const fallback = await supabase.auth.verifyOtp({
      email: email.data,
      token,
      type: "email",
    });
    error = fallback.error;
  }

  if (error) {
    // Supabase answers a mistyped code and a genuinely expired one with the
    // same otp_expired / 403, so the copy has to cover both rather than guess.
    const throttled =
      error.code === "over_request_rate_limit" || error.status === 429;

    return {
      ok: false,
      attempt,
      message: throttled
        ? "Too many attempts. Wait a minute, then try again."
        : "That code is wrong or has expired. Check the newest email, or send a new code.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseForm(signInSchema, formData, { keep: ["email"] });
  if (!parsed.ok) return parsed.state;

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      redirect(`/verify-email?email=${encodeURIComponent(email)}`);
    }
    return {
      ok: false,
      values: { email },
      message:
        error.code === "invalid_credentials"
          ? "That email and password do not match an account."
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect(safeNextPath(formData.get("next")?.toString()));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resendVerificationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    return { ok: false, message: "Enter the email address you signed up with." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.data,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=/dashboard` },
  });

  if (error) {
    return {
      ok: false,
      message:
        error.code === "over_email_send_rate_limit"
          ? "That is a lot of emails. Wait a minute, then try again."
          : error.message,
    };
  }

  return {
    ok: true,
    message: `New code sent to ${email.data}. Use the most recent email, the older code stops working.`,
  };
}

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    return { ok: false, errors: { email: "Enter a valid email address." } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${siteUrl()}/auth/confirm?type=recovery&next=/reset-password`,
  });

  if (error && error.code === "over_email_send_rate_limit") {
    return { ok: false, message: "That is a lot of emails. Wait a minute, then try again." };
  }

  // Deliberately the same answer whether or not the address is on file.
  return {
    ok: true,
    message: `If ${email.data} belongs to an account, a reset link is on its way.`,
  };
}

export async function updatePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) {
    return { ok: false, errors: { password: password.error.issues[0].message } };
  }
  if (formData.get("password") !== formData.get("confirmPassword")) {
    return { ok: false, errors: { confirmPassword: "Passwords do not match." } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "That reset link has expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
