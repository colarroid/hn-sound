import { z } from "zod";

const MIN_AGE = 10;
const MAX_AGE = 110;

const name = z
  .string()
  .trim()
  .min(2, "At least 2 characters.")
  .max(60, "Keep it under 60 characters.");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .toLowerCase()
  .pipe(z.email("That does not look like an email address."));

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters.")
  .max(72, "Keep it under 72 characters.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

/**
 * Nigerian numbers arrive as 0803..., +234803... or with spaces. Store what the
 * member typed, minus the noise, so the directory can dial it.
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(7, "That number looks too short.")
  .max(20, "That number looks too long.")
  .regex(/^[+()\-\s\d]+$/, "Digits, spaces, and + only.")
  .transform((value) => value.replace(/[()\-\s]/g, ""));

export const dateOfBirthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "That is not a real date.")
  .refine((value) => {
    const age = ageOn(value);
    return age >= MIN_AGE && age <= MAX_AGE;
  }, `Enter a date of birth between ${MIN_AGE} and ${MAX_AGE} years ago.`);

export const signUpSchema = z
  .object({
    firstName: name,
    lastName: name,
    email: emailSchema,
    phone: phoneSchema,
    dateOfBirth: dateOfBirthSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export function ageOn(dateOfBirth: string, today = new Date()) {
  const dob = new Date(`${dateOfBirth}T00:00:00Z`);
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
}
