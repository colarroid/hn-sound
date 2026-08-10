import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

/**
 * Service role client. Bypasses row level security entirely, so it is only for
 * work that cannot be done as the signed-in user: signing URLs for the private
 * training bucket, and writing objects into it.
 *
 * Never import this into a client component. Every caller must check the user's
 * role or eligibility itself first, because RLS will not do it here.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient is server only");
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
