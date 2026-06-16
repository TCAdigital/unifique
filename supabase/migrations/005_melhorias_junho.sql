-- ================================================================
-- Melhorias 14/06/2026
-- ================================================================

-- negocios: novos campos
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS link_proposta TEXT;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS custo_oportunidade NUMERIC(18,2) DEFAULT 0;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS custo_cliente NUMERIC(18,2) DEFAULT 0;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS vigencia_meses INT DEFAULT 0;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS projeto_fase VARCHAR(50) DEFAULT 'Compras';

-- orcamentos: link opcional para negocio (mutex com empresa)
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES negocios(id) ON DELETE SET NULL;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS negocio_nome VARCHAR(200);

NOTIFY pgrst, 'reload schema';
