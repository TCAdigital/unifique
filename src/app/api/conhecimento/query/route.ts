import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type HistoryMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_AI_API_KEY não configurado no servidor." },
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

    // Load all text knowledge from DB automatically
    const sb = getClient();
    const { data: docs } = await sb
      .from("base_conhecimento")
      .select("nome, conteudo, tags")
      .eq("tipo", "texto")
      .not("conteudo", "is", null)
      .order("created_at", { ascending: true });

    const context =
      docs && docs.length > 0
        ? docs
            .map((d) => `[${d.nome}]\n${d.conteudo}`)
            .join("\n\n---\n\n")
        : "";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `Você é um assistente especialista da Unifique Plataforma TIC, focado em suporte técnico e comercial.
Responda SOMENTE com base no conteúdo da base de conhecimento abaixo. Use português do Brasil, seja objetivo e profissional.
Se a informação NÃO estiver disponível na base de conhecimento, comece sua resposta EXATAMENTE com a marcação: [SEM_RESPOSTA]
Após a marcação, oriente brevemente o usuário a consultar as fontes externas disponíveis no widget.
Nunca invente informações que não estejam na base.

=== BASE DE CONHECIMENTO ===
${context || "(Base de conhecimento ainda sem conteúdo cadastrado)"}
=== FIM DA BASE ===`,
    });

    const contents = [
      ...history.slice(-6).map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.content }],
      })),
      { role: "user" as const, parts: [{ text: question }] },
    ];

    const result = await model.generateContent({ contents });
    const rawAnswer = result.response.text();

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
