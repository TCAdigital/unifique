-- ================================================================
-- 012 — Base de Conhecimento: storage bucket + tabela de metadados
-- Execute no SQL Editor do Supabase
-- ================================================================

-- Bucket público para PDFs (public = arquivos acessíveis via URL direta)
INSERT INTO storage.buckets (id, name, public)
VALUES ('conhecimento', 'conhecimento', true)
ON CONFLICT (id) DO NOTHING;

-- Política de acesso: anon pode fazer tudo no bucket
DROP POLICY IF EXISTS "conhecimento_anon" ON storage.objects;
CREATE POLICY "conhecimento_anon" ON storage.objects
  FOR ALL TO anon
  USING (bucket_id = 'conhecimento')
  WITH CHECK (bucket_id = 'conhecimento');

-- Tabela de metadados dos documentos
CREATE TABLE IF NOT EXISTS base_conhecimento (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome            VARCHAR(300) NOT NULL,
  descricao       TEXT,
  tags            TEXT[]       NOT NULL DEFAULT '{}',
  storage_path    TEXT         NOT NULL,
  storage_url     TEXT,
  tamanho_bytes   BIGINT       NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE base_conhecimento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all ON base_conhecimento;
CREATE POLICY anon_all ON base_conhecimento FOR ALL TO anon USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
