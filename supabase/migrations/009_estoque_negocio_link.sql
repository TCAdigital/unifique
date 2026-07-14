-- ================================================================
-- Novas Melhorias — SC/PO vinculado a negócio Ganho
-- Execute no SQL Editor do Supabase
-- ================================================================

-- Adiciona referência ao negócio (deal Ganho) no item de estoque
ALTER TABLE ti_itens ADD COLUMN IF NOT EXISTS negocio_id   UUID REFERENCES negocios(id) ON DELETE SET NULL;
ALTER TABLE ti_itens ADD COLUMN IF NOT EXISTS negocio_nome VARCHAR(200);

NOTIFY pgrst, 'reload schema';
