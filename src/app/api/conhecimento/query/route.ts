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

    const { documentIds, question, history = [] } = (await request.json()) as {
      documentIds: string[];
      question: string;
      history: HistoryMessage[];
    };

    if (!question?.trim()) {
      return NextResponse.json({ error: "Pergunta vazia" }, { status: 400 });
    }
    if (!documentIds || documentIds.length === 0) {
      return NextResponse.json({ error: "Nenhum documento selecionado" }, { status: 400 });
    }

    const sb = getClient();
    const { data: docs, error: dbErr } = await sb
      .from("base_conhecimento")
      .select("storage_url, nome")
      .in("id", documentIds);

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 });
    if (!docs || docs.length === 0) {
      return NextResponse.json({ error: "Documentos não encontrados" }, { status: 400 });
    }

    // Download PDFs and encode as base64
    const pdfParts = await Promise.all(
      docs.map(async (doc) => {
        const res = await fetch(doc.storage_url);
        if (!res.ok) throw new Error(`Falha ao baixar "${doc.nome}": ${res.statusText}`);
        const buffer = await res.arrayBuffer();
        return {
          inlineData: {
            data: Buffer.from(buffer).toString("base64"),
            mimeType: "application/pdf" as const,
          },
        };
      })
    );

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `Você é um assistente especialista que responde perguntas com base nos documentos fornecidos.
Responda SOMENTE com base no conteúdo dos documentos. Se a informação não estiver nos documentos, diga claramente.
Use linguagem profissional em português. Seja preciso e objetivo. Cite o contexto do documento quando relevante.`,
    });

    // Synthetic first turn provides all PDFs, then conversation history, then current question
    const contents = [
      {
        role: "user" as const,
        parts: [
          ...pdfParts,
          { text: `Leia estes ${docs.length} documento(s) atentamente. Responderei perguntas baseadas neles.` },
        ],
      },
      {
        role: "model" as const,
        parts: [
          { text: `Entendido. Li os ${docs.length} documento(s) (${docs.map((d) => d.nome).join(", ")}) e estou pronto para responder.` },
        ],
      },
      // Last 6 history messages (3 exchanges)
      ...history.slice(-6).map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.content }],
      })),
      {
        role: "user" as const,
        parts: [{ text: question }],
      },
    ];

    const result = await model.generateContent({ contents });
    const answer = result.response.text();

    return NextResponse.json({ answer });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
