/**
 * Cadência de prospecção do Agente SDR (Unifique).
 *
 * Fonte: "Melhorias CRM" (esteira de prospecção) + "Playbook de Vendas Consultivas".
 * Regra de negócio: contas com status LEAD não entram no Diagnóstico da Agenda do Dia —
 * elas entram aqui e o Agente SDR trabalha a cadência até virar NEGOCIANDO ou ATIVO.
 *
 * Nada é disparado automaticamente: o módulo apenas monta as mensagens e os links
 * (wa.me / mailto), que o consultor revisa e envia pelo canal do CRM (WhatsApp/O365).
 */

export interface LeadContato {
  empresa: string;
  contato?: string | null;
  email?: string | null;
  tel?: string | null;
}

export interface EtapaCadencia {
  dia: number;
  canal: "WhatsApp" | "E-mail";
  titulo: string;
  objetivo: string;
}

/** D0 (primeiro contato) → D+3 → D+7 → D+15 (pausa da cadência). */
export const CADENCIA_SDR: EtapaCadencia[] = [
  {
    dia: 0,
    canal: "WhatsApp",
    titulo: "Primeiro contato consultivo",
    objetivo: "Abrir conversa e mapear prioridades de tecnologia dos próximos meses",
  },
  {
    dia: 3,
    canal: "WhatsApp",
    titulo: "Reforço leve",
    objetivo: "Relembrar a mensagem com gancho rápido de eficiência ou dado de mercado",
  },
  {
    dia: 7,
    canal: "E-mail",
    titulo: "Dor + caso de sucesso",
    objetivo: "Apresentar exemplo prático do mesmo setor (SOC/EDR, Cloud, NOC)",
  },
  {
    dia: 15,
    canal: "E-mail",
    titulo: "Material de valor",
    objetivo: "Oferecer checklist de maturidade em segurança/infra e pausar a cadência",
  },
];

/** Perguntas de abertura do Playbook, por frente de solução. */
export const GANCHOS_PLAYBOOK: { frente: string; parceiros: string; pergunta: string }[] = [
  {
    frente: "Cibersegurança & Endpoint",
    parceiros: "CrowdStrike, Fortinet, Tenable",
    pergunta: "Quanto custa para sua operação ficar 24h inativa por um ataque?",
  },
  {
    frente: "Segurança Cloud & SASE",
    parceiros: "Netskope",
    pergunta: "Como vocês governam dados sensíveis que hoje circulam fora da rede corporativa?",
  },
  {
    frente: "SIEM / Open Source",
    parceiros: "Wazuh",
    pergunta: "Quem olha os logs da operação hoje e em quanto tempo um evento crítico aparece?",
  },
  {
    frente: "Performance & Aplicações",
    parceiros: "GoCache",
    pergunta: "Uma queda de 3 segundos no seu portal representa quantos pedidos perdidos?",
  },
  {
    frente: "Backup & DR",
    parceiros: "Veeam",
    pergunta: "Qual é o RTO/RPO aceitável para o seu negócio em um incidente crítico?",
  },
  {
    frente: "Conectividade / Telecom",
    parceiros: "Link Dedicado / SD-WAN",
    pergunta: "Qual o impacto financeiro de uma indisponibilidade de link no seu horário de pico?",
  },
];

function primeiroNome(nomeCompleto?: string | null, fallback = "cliente"): string {
  const nome = (nomeCompleto ?? "").trim();
  if (!nome) return fallback;
  return nome.split(/\s+/)[0];
}

function nomeEmpresa(lead: LeadContato): string {
  return (lead.empresa ?? "").trim() || "sua empresa";
}

function nomeConsultor(consultor?: string | null): string {
  return (consultor ?? "").trim() || "Consultor Unifique";
}

/** 1º contato — WhatsApp (script consultivo e direto do documento de melhorias). */
export function mensagemWhatsAppProspeccao(lead: LeadContato, consultor?: string | null): string {
  return [
    `Oi ${primeiroNome(lead.contato)}! Tudo bem? 😊`,
    `Aqui é ${nomeConsultor(consultor)}, da Unifique. Estou entrando em contato para apresentar brevemente nosso trabalho.`,
    "Apoiamos empresas em diferentes desafios de tecnologia, com serviços Gerenciados de TI, Cloud, Service Desk, Infraestrutura e NOC, Cibersegurança e SOC.",
    "Queria entender um pouco melhor o momento de vocês: existe alguma frente de tecnologia que esteja entre as prioridades ou projetos previstos para os próximos meses?",
  ].join("\n\n");
}

/** 1º contato — e-mail institucional. */
export function emailProspeccao(
  lead: LeadContato,
  consultor?: string | null
): { assunto: string; corpo: string } {
  return {
    assunto: `Parceria estratégica em TI e Cibersegurança para a ${nomeEmpresa(lead)}`,
    corpo: [
      `Olá, ${primeiroNome(lead.contato)}, tudo bem?`,
      `Acompanhando o crescimento da ${nomeEmpresa(lead)}, imaginei que a eficiência e a segurança da infraestrutura tecnológica devam ser focos importantes para o seu negócio este trimestre.`,
      "Nós, da Unifique, auxiliamos empresas a blindarem suas operações e otimizarem custos através de soluções robustas em Cloud, Cibersegurança (SOC/EDR), Service Desk e Redes Gerenciadas.",
      "Vocês estão avaliando algum projeto ou melhoria nessas áreas no momento?",
      `Um abraço,\n${nomeConsultor(consultor)}\nUnifique`,
    ].join("\n\n"),
  };
}

/** Follow-ups da cadência (D+3 / D+7 / D+15). */
export function mensagemFollowUp(dia: EtapaCadencia["dia"], lead: LeadContato): string {
  const cliente = primeiroNome(lead.contato);
  const empresa = nomeEmpresa(lead);

  if (dia === 3) {
    return [
      `Oi ${cliente}, tudo bem?`,
      `Passando para retomar meu contato sobre eficiência e segurança de TI na ${empresa}.`,
      "Um dado rápido: a maioria dos incidentes graves de rede só é percebida depois de horas de indisponibilidade — e o custo disso costuma ser bem maior que a prevenção.",
      "Faz sentido conversarmos 15 minutos esta semana?",
    ].join("\n\n");
  }

  if (dia === 7) {
    return [
      `Oi ${cliente}!`,
      `Recentemente ajudamos uma empresa do setor da ${empresa} a reduzir incidentes de rede e ganhar previsibilidade de custos de TI.`,
      "Se fizer sentido, compartilho o caso completo e mostro como ficaria para a sua operação.",
      "Posso te enviar?",
    ].join("\n\n");
  }

  return [
    `Oi ${cliente}, encerrando meu follow-up por aqui.`,
    "Preparei um checklist de maturidade em segurança e infraestrutura que usamos nos diagnósticos da Unifique — é gratuito e ajuda a enxergar pontos de risco rapidamente.",
    "Quer que eu envie? Se preferir retomar depois, é só me chamar.",
  ].join("\n\n");
}

/** Normaliza para o formato aceito pelo wa.me (55 + DDD + número). */
export function normalizarTelefone(tel?: string | null): string {
  const digitos = (tel ?? "").replace(/\D/g, "");
  if (!digitos) return "";
  if (digitos.startsWith("55") && digitos.length >= 12) return digitos;
  return `55${digitos}`;
}

export function linkWhatsApp(tel: string | null | undefined, mensagem: string): string {
  const numero = normalizarTelefone(tel);
  if (!numero) return "";
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export function linkEmail(
  destino: string | null | undefined,
  assunto: string,
  corpo: string
): string {
  if (!destino?.trim()) return "";
  return `mailto:${destino.trim()}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}

/** O que falta para o Agente SDR conseguir iniciar a cadência. */
export function pendenciasContato(lead: LeadContato): string[] {
  const faltando: string[] = [];
  if (!lead.contato?.trim()) faltando.push("nome do contato");
  if (!lead.email?.trim()) faltando.push("e-mail");
  if (!lead.tel?.trim()) faltando.push("telefone");
  return faltando;
}

export function contatoCompleto(lead: LeadContato): boolean {
  return pendenciasContato(lead).length === 0;
}

