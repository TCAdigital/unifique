import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function getDB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type HistoryMessage = { role: "user" | "assistant"; content: string };

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY não configurado no servidor." },
        { status: 500 }
      );
    }

    const { question, history = [] } = (await request.json()) as {
      question: string;
      history: HistoryMessage[];
    };

    if (!question?.trim()) {
      return NextResponse.json({ error: "Pergunta vazia" }, { status: 400 });
    }

    const db = getDB();
    const perguntaNorm = normalizar(question);

    // ── 1. Verifica cache de respostas anteriores ────────────────────────
    const { data: cached } = await db.rpc("buscar_cache", {
      q: perguntaNorm,
      threshold: 0.70,
    });

    if (cached && cached.length > 0) {
      const hit = cached[0];
      db.from("cache_respostas")
        .update({ hits: hit.hits + 1 })
        .eq("id", hit.id)
        .then(() => {});

      return NextResponse.json({ answer: hit.resposta, fromCache: true });
    }

    // ── 2. Carrega base de conhecimento do banco ─────────────────────────
    const { data: conhecimentos } = await db
      .from("base_conhecimento")
      .select("nome, conteudo")
      .eq("tipo", "texto")
      .not("conteudo", "is", null)
      .order("created_at", { ascending: true });

    const temConhecimento = conhecimentos && conhecimentos.length > 0;
    const baseConhecimento = temConhecimento
      ? conhecimentos!.map((d) => `[${d.nome}]\n${d.conteudo}`).join("\n\n---\n\n")
      : "";

    // ── 3. Chama Claude apenas para processar o conteúdo do banco ────────
    const client = new Anthropic({ apiKey });

    const systemPrompt = temConhecimento
      ? `Você é um assistente da Unifique Plataforma TIC.
Responda SOMENTE com base no conteúdo da base de conhecimento abaixo — não use conhecimento externo.
Se a pergunta não puder ser respondida com o conteúdo disponível, diga claramente: "Não encontrei essa informação na nossa base de conhecimento."
Use português do Brasil, seja objetivo e profissional.

=== BASE DE CONHECIMENTO ===
${baseConhecimento}
=== FIM DA BASE ===`
      : `Você é um assistente da Unifique Plataforma TIC.
A base de conhecimento ainda não possui conteúdo cadastrado.
Informe ao usuário que a base está sendo construída e que em breve haverá informações disponíveis.`;

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-6).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: question },
    ];

    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const answer = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    // ── 4. Salva no cache para reutilização futura ────────────────────────
    if (history.length === 0) {
      db.from("cache_respostas")
        .insert({
          pergunta: question.trim(),
          pergunta_norm: perguntaNorm,
          resposta: answer,
          redirect_to_links: false,
        })
        .then(() => {});
    }

    return NextResponse.json({ answer, fromCache: false });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
