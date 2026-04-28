import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const body = await request.json();
  const { dados } = body as {
    dados: {
      ano: number;
      meses: {
        mes: string;
        eventos: number;
        leads: number;
        mqls: number;
        sqls: number;
        custo: number;
        clientes: number;
        ltv: number;
      }[];
      metas: {
        eventos: number;
        leads: number;
        mqls: number;
        sqls: number;
      };
    };
  };

  const totalEventos = dados.meses.reduce((s, m) => s + m.eventos, 0);
  const totalLeads = dados.meses.reduce((s, m) => s + m.leads, 0);
  const totalMQLs = dados.meses.reduce((s, m) => s + m.mqls, 0);
  const totalSQLs = dados.meses.reduce((s, m) => s + m.sqls, 0);
  const totalCusto = dados.meses.reduce((s, m) => s + m.custo, 0);
  const totalClientes = dados.meses.reduce((s, m) => s + m.clientes, 0);
  const totalLTV = dados.meses.reduce((s, m) => s + m.ltv, 0);

  const taxaLeadMQL = totalLeads > 0 ? ((totalMQLs / totalLeads) * 100).toFixed(1) : "0";
  const taxaMQLSQL = totalMQLs > 0 ? ((totalSQLs / totalMQLs) * 100).toFixed(1) : "0";
  const cac = totalClientes > 0 ? (totalCusto / totalClientes).toFixed(2) : "0";
  const ltvMedio = totalClientes > 0 ? (totalLTV / totalClientes).toFixed(2) : "0";

  const prompt = `Você é um analista de marketing B2B especialista em eventos corporativos para o setor de TIC (Tecnologia da Informação e Comunicação).

Analise os dados de OKR de Eventos TIC B2B da Rede Unifique para ${dados.ano}:

**DADOS ACUMULADOS:**
- Eventos realizados: ${totalEventos} de ${dados.metas.eventos} (meta anual)
- Leads captados: ${totalLeads} de ${dados.metas.leads} (meta anual)
- MQLs: ${totalMQLs} de ${dados.metas.mqls} (meta: 30% dos leads)
- SQLs: ${totalSQLs} de ${dados.metas.sqls} (meta: 15% dos MQLs)
- Custo total: R$ ${totalCusto.toLocaleString("pt-BR")}
- Clientes gerados: ${totalClientes}
- LTV total: R$ ${totalLTV.toLocaleString("pt-BR")}

**TAXAS:**
- Conversão Lead → MQL: ${taxaLeadMQL}% (referência mercado B2B: 25-35%)
- Conversão MQL → SQL: ${taxaMQLSQL}% (referência mercado B2B: 10-20%)
- CAC médio: R$ ${Number(cac).toLocaleString("pt-BR")}
- LTV médio: R$ ${Number(ltvMedio).toLocaleString("pt-BR")}

**DADOS MENSAIS:**
${dados.meses.map((m) => `${m.mes}: ${m.eventos} eventos, ${m.leads} leads, ${m.mqls} MQLs, ${m.sqls} SQLs, custo R$ ${m.custo.toLocaleString("pt-BR")}`).join("\n")}

Forneça uma análise estratégica em português brasileiro com:
1. **Diagnóstico Geral** (2-3 frases sobre performance geral)
2. **Pontos Fortes** (2-3 bullet points)
3. **Pontos de Atenção** (2-3 bullet points com riscos)
4. **Recomendações Prioritárias** (3 ações específicas para os próximos 30-60 dias)
5. **Projeção** (previsão de atingimento das metas anuais baseada na tendência atual)

Seja direto, objetivo e use linguagem executiva. Máximo 400 palavras.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  return Response.json({ analise: text });
}
