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

    // Carrega todo o conteúdo de texto da base de conhecimento
    const { data: docs } = await getDB()
      .from("base_conhecimento")
      .select("nome, conteudo, tags")
      .eq("tipo", "texto")
      .not("conteudo", "is", null)
      .order("created_at", { ascending: true });

    const context =
      docs && docs.length > 0
        ? docs.map((d) => `[${d.nome}]\n${d.conteudo}`).join("\n\n---\n\n")
        : "";

    const client = new Anthropic({ apiKey });

    const systemPrompt = `Você é um assistente especialista da Unifique Plataforma TIC, focado em suporte técnico e comercial.
Responda SOMENTE com base no conteúdo da base de conhecimento abaixo. Use português do Brasil, seja objetivo e profissional.
Se a informação NÃO estiver disponível na base de conhecimento, comece sua resposta EXATAMENTE com a marcação: [SEM_RESPOSTA]
Após a marcação, oriente brevemente o usuário a consultar as fontes externas disponíveis no widget.
Nunca invente informações que não estejam na base.

=== BASE DE CONHECIMENTO ===
${context || "(Base de conhecimento ainda sem conteúdo cadastrado)"}
=== FIM DA BASE ===`;

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-6).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: question },
    ];

    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    const rawAnswer = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const redirectToLinks = rawAnswer.trimStart().startsWith("[SEM_RESPOSTA]");
    const answer = rawAnswer.replace(/^\[SEM_RESPOSTA\]\s*/i, "").trim();

    return NextResponse.json({ answer, redirectToLinks });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
