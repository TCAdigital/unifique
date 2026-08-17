import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = getClient();

  const { data: doc } = await sb
    .from("base_conhecimento")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (doc?.storage_path) {
    await sb.storage.from("conhecimento").remove([doc.storage_path]);
  }

  const { error } = await sb.from("base_conhecimento").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
