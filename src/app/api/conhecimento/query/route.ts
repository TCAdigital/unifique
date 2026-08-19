import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

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

    const client = new Anthropic({ apiKey });

    const systemPrompt = `Você é um assistente especialista técnico e comercial da Unifique Plataforma TIC, empresa brasileira de tecnologia e telecomunicações.

Você tem amplo conhecimento sobre os produtos e tecnologias que a Unifique comercializa e suporta, incluindo:
- **Fortinet**: FortiGate (firewall/NGFW), FortiSwitch, FortiAP, FortiAnalyzer, FortiManager, FortiEDR, SD-WAN, VPN, Zero Trust, licenciamento FortiCare e UTP
- **CrowdStrike**: Falcon Platform, EDR/XDR, Threat Intelligence, Falcon Go/Pro/Enterprise, módulos como Prevent, Insight, Discover, OverWatch
- **Redes e infraestrutura**: SD-WAN, MPLS, BGP, VLANs, QoS, segmentação de rede, alta disponibilidade
- **Segurança**: NGFW, IPS/IDS, antivírus corporativo, endpoint protection, SIEM, gestão de vulnerabilidades
- **Licenciamento**: modelos de licença por usuário, por dispositivo, subscrições anuais, bundle vs. modular

Responda de forma objetiva, profissional e em português do Brasil.
Seja técnico quando necessário, mas acessível para perfis comerciais.

Se a pergunta for sobre informações internas e específicas da Unifique — como preços praticados, contratos específicos de clientes, processos internos, ou dados proprietários — diga que não tem essa informação disponível aqui e comece sua resposta EXATAMENTE com: [SEM_RESPOSTA]
Após a marcação, oriente o usuário a consultar as fontes externas disponíveis no widget.`;

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
