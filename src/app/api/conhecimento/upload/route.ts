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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const nome = (formData.get("nome") as string) || "";
    const descricao = (formData.get("descricao") as string) || "";
    const tagsRaw = (formData.get("tags") as string) || "";
    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Apenas arquivos PDF são aceitos" }, { status: 400 });
    }

    const sb = getClient();
    const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
    const path = `${Date.now()}_${safeName}`;

    const { error: storageErr } = await sb.storage
      .from("conhecimento")
      .upload(path, file, { contentType: "application/pdf", upsert: false });

    if (storageErr) {
      return NextResponse.json({ error: storageErr.message }, { status: 400 });
    }

    const { data: { publicUrl } } = sb.storage.from("conhecimento").getPublicUrl(path);

    const { data, error: dbErr } = await sb
      .from("base_conhecimento")
      .insert({
        nome: nome || file.name.replace(/\.pdf$/i, ""),
        descricao: descricao || null,
        tags,
        storage_path: path,
        storage_url: publicUrl,
        tamanho_bytes: file.size,
      })
      .select()
      .single();

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
