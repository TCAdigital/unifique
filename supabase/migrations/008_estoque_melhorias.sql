-- ================================================================
-- Novas Melhorias 12/07/2026 — Estoque TIC
-- Execute no SQL Editor do Supabase
-- ================================================================

-- Atualiza constraint de categoria para incluir Celular e FWA
ALTER TABLE ti_itens DROP CONSTRAINT IF EXISTS ti_itens_tipo_check;
ALTER TABLE ti_itens ADD CONSTRAINT ti_itens_tipo_check
  CHECK (tipo IN ('Hardware','Software','Network','Infraestrutura','Segurança','Cabeamento','Celular','FWA','Outro'));

-- Novos campos
ALTER TABLE ti_itens ADD COLUMN IF NOT EXISTS sku             VARCHAR(100);
ALTER TABLE ti_itens ADD COLUMN IF NOT EXISTS capex_opex      VARCHAR(5)   DEFAULT 'CAPEX' CHECK (capex_opex IN ('CAPEX','OPEX'));
ALTER TABLE ti_itens ADD COLUMN IF NOT EXISTS vigencia_garantia DATE;
ALTER TABLE ti_itens ADD COLUMN IF NOT EXISTS nfe_fornecedor  VARCHAR(100);
ALTER TABLE ti_itens ADD COLUMN IF NOT EXISTS sc_po           VARCHAR(50);

NOTIFY pgrst, 'reload schema';
