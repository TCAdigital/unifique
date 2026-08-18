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

export async function GET() {
  const { data, error } = await getClient()
    .from("notificacoes")
    .select("id, titulo, mensagem, tipo, autor, created_at")
    .eq("ativo", true)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const { titulo, mensagem, tipo = "info", autor } = await request.json();

  if (!titulo?.trim() || !mensagem?.trim()) {
    return NextResponse.json({ error: "Título e mensagem são obrigatórios" }, { status: 400 });
  }

  const { data, error } = await getClient()
    .from("notificacoes")
    .insert({ titulo: titulo.trim(), mensagem: mensagem.trim(), tipo, autor: autor ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
