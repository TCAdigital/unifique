-- ================================================================
-- UNIFIQUE — Pipeline Ganho/Perdido + Produtos + Fix Orçamento (003)
-- Execute no SQL Editor do Supabase
-- ================================================================

-- Fix: orcamentos.status CHECK aceitar os valores do app
ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS orcamentos_status_check;
ALTER TABLE orcamentos ADD CONSTRAINT orcamentos_status_check
  CHECK (status IN ('Planejado','Executado','Pendente','Cancelado','Ativo','Encerrado'));

-- Negocios: array de produtos/serviços vinculados
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS produtos TEXT[] DEFAULT '{}';
