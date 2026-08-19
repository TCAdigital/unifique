-- ================================================================
-- 015 — Cache de respostas da IA
-- Execute no SQL Editor do Supabase
-- ================================================================

-- Trigrama para busca por similaridade (já habilitado no Supabase por padrão)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS cache_respostas (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  pergunta          TEXT        NOT NULL,
  pergunta_norm     TEXT        NOT NULL,          -- versão normalizada para comparação
  resposta          TEXT        NOT NULL,
  redirect_to_links BOOLEAN     NOT NULL DEFAULT false,
  hits              INTEGER     NOT NULL DEFAULT 1, -- quantas vezes foi reutilizada
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice de trigrama para busca rápida por similaridade
CREATE INDEX IF NOT EXISTS cache_respostas_trgm
  ON cache_respostas USING GIN (pergunta_norm gin_trgm_ops);

ALTER TABLE cache_respostas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all ON cache_respostas;
CREATE POLICY anon_all ON cache_respostas FOR ALL TO anon USING (true) WITH CHECK (true);

-- Função de busca por similaridade (threshold padrão: 70%)
CREATE OR REPLACE FUNCTION buscar_cache(q text, threshold float DEFAULT 0.70)
RETURNS TABLE (id uuid, resposta text, redirect_to_links boolean, hits integer)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id, resposta, redirect_to_links, hits
  FROM cache_respostas
  WHERE similarity(pergunta_norm, q) > threshold
  ORDER BY similarity(pergunta_norm, q) DESC
  LIMIT 1;
$$;

NOTIFY pgrst, 'reload schema';
