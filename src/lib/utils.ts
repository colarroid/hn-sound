type ClassValue = string | number | null | undefined | false | ClassValue[];

/** Small class name joiner. Keeps the dependency list short. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }
  return out.join(" ");
}

export function fullName(profile: { first_name: string; last_name: string }) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
}

export function initials(profile: { first_name: string; last_name: string }) {
  const first = profile.first_name?.[0] ?? "";
  const last = profile.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}
