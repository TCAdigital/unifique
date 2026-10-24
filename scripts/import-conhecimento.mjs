// Script: importa base_conhecimento_unifique.md → tabela base_conhecimento
// Uso: node scripts/import-conhecimento.mjs
// Pré-requisito: migration 013 executada no Supabase

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, "..", ".env.local");
const envVars = {};
try {
  readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const [k, ...v] = line.split("=");
    if (k && v.length) envVars[k.trim()] = v.join("=").trim();
  });
} catch {}

const SUPABASE_URL = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const SUPABASE_KEY = envVars["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Variáveis Supabase não encontradas no .env.local");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Documentos importados para a Base de Conhecimento (o nome é a chave de atualização)
const DOCUMENTOS = [
  {
    arquivo: "base_conhecimento_unifique.md",
    nome: "Playbook Comercial & Portfólio Unifique TIC",
    descricao:
      "Fundamentos comerciais, SPIN selling, ICP, portfólio de soluções Fortinet, CrowdStrike, Cloud e GoCache",
    tags: ["playbook", "comercial", "fortinet", "crowdstrike", "cloud", "spin", "icp"],
  },
  {
    arquivo: "playbook_vendas_telecom_tecnologia.md",
    nome: "Playbook de Vendas Consultivas — Telecom, Cloud e Cibersegurança",
    descricao:
      "Técnicas de venda consultiva, mapa de soluções por parceiro, tratamento de objeções, checklist diário, roteiro em blocos de tempo e cadência SDR (D0/D+3/D+7/D+15)",
    tags: [
      "playbook",
      "vendas consultivas",
      "telecom",
      "ciberseguranca",
      "cloud",
      "objecoes",
      "cadencia",
      "sdr",
      "crowdstrike",
      "netskope",
      "fortinet",
      "wazuh",
      "gocache",
      "tenable",
      "veeam",
    ],
  },
];

for (const doc of DOCUMENTOS) {
  const mdPath = join(__dir, "..", doc.arquivo);
  let conteudo;
  try {
    conteudo = readFileSync(mdPath, "utf8");
  } catch {
    console.warn(`⚠️  Arquivo não encontrado, ignorando: ${doc.arquivo}`);
    continue;
  }
  console.log(`📄 ${doc.arquivo}: ${conteudo.length} caracteres`);

  // Verifica se já existe uma entrada com esse nome
  const { data: existing } = await sb
    .from("base_conhecimento")
    .select("id")
    .eq("nome", doc.nome);

  if (existing && existing.length > 0) {
    console.log(`♻️  "${doc.nome}" já existe — atualizando conteúdo...`);
    const { error } = await sb
      .from("base_conhecimento")
      .update({ conteudo, tamanho_bytes: Buffer.byteLength(conteudo, "utf8") })
      .eq("id", existing[0].id);
    if (error) { console.error("❌ Erro ao atualizar:", error.message); process.exit(1); }
    console.log("✅ Conteúdo atualizado com sucesso!");
  } else {
    console.log(`➕ Inserindo "${doc.nome}"...`);
    const { error } = await sb.from("base_conhecimento").insert({
      tipo: "texto",
      nome: doc.nome,
      descricao: doc.descricao,
      tags: doc.tags,
      conteudo,
      storage_path: "",
      tamanho_bytes: Buffer.byteLength(conteudo, "utf8"),
    });
    if (error) { console.error("❌ Erro ao inserir:", error.message); process.exit(1); }
    console.log("✅ Base de conhecimento importada com sucesso!");
  }
}

// Invalida o cache de respostas da IA: o conteúdo mudou e respostas antigas
// (gravadas com a base anterior) não podem mais ser servidas.
const { error: cacheErr } = await sb
  .from("cache_respostas")
  .delete({ count: "exact" })
  .not("id", "is", null);

if (cacheErr) {
  console.warn(`⚠️  Não foi possível limpar cache_respostas (${cacheErr.message}).`);
} else {
  console.log("🧹 Cache de respostas da IA invalidado.");
}

