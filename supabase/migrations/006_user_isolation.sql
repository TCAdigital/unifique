-- ================================================================
-- UNIFIQUE — Isolamento por usuário + fix constraint orcamentos (006)
-- Execute no SQL Editor do Supabase
-- ================================================================

-- Garante que o CHECK de status do orcamentos aceita todos os valores usados no app
ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS orcamentos_status_check;
ALTER TABLE orcamentos ADD CONSTRAINT orcamentos_status_check
  CHECK (status IN ('Planejado','Executado','Pendente','Cancelado','Ativo','Encerrado'));

-- Garante que consultor_id existe na tabela orcamentos (pode já existir)
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS consultor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;
