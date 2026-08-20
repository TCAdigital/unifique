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

const mdPath = join(__dir, "..", "base_conhecimento_unifique.md");
const conteudo = readFileSync(mdPath, "utf8");
console.log(`📄 Arquivo lido: ${conteudo.length} caracteres`);

// Verifica se já existe uma entrada com esse nome
const { data: existing } = await sb
  .from("base_conhecimento")
  .select("id")
  .eq("nome", "Playbook Comercial & Portfólio Unifique TIC");

if (existing && existing.length > 0) {
  console.log("♻️  Entrada já existe — atualizando conteúdo...");
  const { error } = await sb
    .from("base_conhecimento")
    .update({ conteudo, tamanho_bytes: Buffer.byteLength(conteudo, "utf8") })
    .eq("id", existing[0].id);
  if (error) { console.error("❌ Erro ao atualizar:", error.message); process.exit(1); }
  console.log("✅ Conteúdo atualizado com sucesso!");
} else {
  console.log("➕ Inserindo novo registro...");
  const { error } = await sb.from("base_conhecimento").insert({
    tipo: "texto",
    nome: "Playbook Comercial & Portfólio Unifique TIC",
    descricao: "Fundamentos comerciais, SPIN selling, ICP, portfólio de soluções Fortinet, CrowdStrike, Cloud e GoCache",
    tags: ["playbook", "comercial", "fortinet", "crowdstrike", "cloud", "spin", "icp"],
    conteudo,
    storage_path: "",
    tamanho_bytes: Buffer.byteLength(conteudo, "utf8"),
  });
  if (error) { console.error("❌ Erro ao inserir:", error.message); process.exit(1); }
  console.log("✅ Base de conhecimento importada com sucesso!");
}
