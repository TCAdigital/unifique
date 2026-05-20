-- ================================================================
-- UNIFIQUE — CRM Improvements v2 (002)
-- Execute no SQL Editor do Supabase
-- ================================================================

-- Notas (polimórfico: empresas, negocios, tarefas)
CREATE TABLE IF NOT EXISTS notas (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidade_tipo VARCHAR(50)  NOT NULL,
  entidade_id   UUID         NOT NULL,
  conteudo      TEXT         NOT NULL,
  autor         VARCHAR(120),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notas_entidade ON notas(entidade_tipo, entidade_id);
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all ON notas;
CREATE POLICY anon_all ON notas FOR ALL TO anon USING (true) WITH CHECK (true);

-- Concorrentes (vinculados a um negócio)
CREATE TABLE IF NOT EXISTS concorrentes (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID         REFERENCES negocios(id) ON DELETE CASCADE,
  nome       VARCHAR(200) NOT NULL,
  site       TEXT,
  forcas     TEXT,
  fraquezas  TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
ALTER TABLE concorrentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all ON concorrentes;
CREATE POLICY anon_all ON concorrentes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Empresas: adicionar especialista_nome
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS especialista_nome VARCHAR(120);

-- Negocios: adicionar especialista_nome
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS especialista_nome VARCHAR(120);

-- Orcamentos: adicionar empresa_id e empresa_nome
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS empresa_id   UUID REFERENCES empresas(id) ON DELETE SET NULL;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS empresa_nome VARCHAR(200);
