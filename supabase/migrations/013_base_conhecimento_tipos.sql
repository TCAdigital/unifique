-- ================================================================
-- 013 — Base de Conhecimento: adiciona suporte a tipos (pdf, texto, link)
-- Execute no SQL Editor do Supabase
-- ================================================================

ALTER TABLE base_conhecimento ADD COLUMN IF NOT EXISTS tipo    VARCHAR(20) NOT NULL DEFAULT 'pdf';
ALTER TABLE base_conhecimento ADD COLUMN IF NOT EXISTS conteudo TEXT;

NOTIFY pgrst, 'reload schema';
