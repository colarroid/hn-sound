import { NextResponse, type NextRequest } from "next/server";

import { requireMember } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Hands out a short lived signed URL for a training file.
 *
 * The eligibility check is the SELECT itself: it runs as the signed-in member,
 * so row level security returns nothing unless they have been granted this
 * material. Only after that does the service role sign the object.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requireMember();

  const supabase = await createClient();
  const { data: material } = await supabase
    .from("training_materials")
    .select("kind, file_path, file_name")
    .eq("id", id)
    .maybeSingle();

  if (!material || material.kind !== "file" || !material.file_path) {
    return new NextResponse("Not found", { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("training")
    .createSignedUrl(material.file_path, 60, {
      download: material.file_name ?? true,
    });

  if (error || !data) {
    return new NextResponse("Could not prepare that download", { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
